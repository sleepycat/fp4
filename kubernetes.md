# Setting up FP4 in Kubernetes

FP4 is intended to be the first in a new class of workload. One designed to be
portable across the RCMP's many environments. The US DoD has a similarly broad
range of environments, and uses Kubernetes to ensure workloads can be moved
between them.

The [US DoD describes how Kubernetes enables portability](https://dodcio.defense.gov/Portals/0/Documents/Library/DoD%20Enterprise%20DevSecOps%20Reference%20Design%20-%20CNCF%20Kubernetes%20w-DD1910_cleared_20211022.pdf):
> Kubernetes provides an API that ensures total abstraction of orchestration,
> compute, storage, networking, and other core services that guarantees software
> can run in any environment, from the Cloud to being embedded inside platforms
> like jets or satellites.

This is organizationally valuable, but it takes time and practice to build this skillset.

Running the pieces of a single app in a dedicated cluster is a good way to get a
lot of benefit, while staying in the shallow end of the kubernetes space.

## Setting up a local cluster with Minikube

Follow the instructions, and then configure it with as much cpu and ram as possible:

```sh
$ minikube config set memory 40G
❗  These changes will take effect upon a minikube delete and then a minikube start
$ minikube config set cpus 12
❗  These changes will take effect upon a minikube delete and then a minikube start
$ minikube config view
- cpus: 12
- memory: 40G
$ minikube start
```
## Managing yaml with Kustomize

Kubernetes yaml gets complicated. With implicit ordering of the elements, and a
need to do variations on configs, it's good to have a tool that can handle stuff
without injecting another programming language into the stack.

Kustomize is build into `kubectl` (look at `kubectl kustomize`) but also exists
as a free standing command line tool. Either is fine.

## How to create the config for the API.

First we'll `cd api` to jump into the directory for the api service. There we'll
create a subfolder with `mkdir kubernetes` and create some basic config.

Access to secrets is scoped by namespaces, so we want to add some basic "soft" isolation by keeping each service it's own namespace.
```sh
$ kubectl create namespace api --output=yaml --dry-run=client > kubernetes/namespace.yaml
# We've packed our api into the fp4-api image.
# So we'll create a deployment telling k8s to run 1 instance (replicas) of whatever is in that image and run that in the api namespace.
$ kubectl create deployment --namespace=api --image=ghcr.io/sleepycat/fp4-api:latest --replicas=1 --port=3000 api --output=yaml --dry-run=client > kubernetes/deployment.yaml
# Next we want our api to have an proper ip and name inside the cluster. We do that with a "service":
$ kubectl create service clusterip --namespace=api --tcp=3000:3000 api --output=yaml --dry-run=client > kubernetes/service.yaml
```
Next we'll initialize kustomize in this directory. It'll create it's own little
config file called `kustomization.yaml` that governs which config files are
included and what processing is done on them.

```sh
$ kustomize init --namespace=api --resources=kubernetes/*
```
That created some `kustomize` config that includes files in our kubernetes folder.
Running `kustomize build` now will get kustomize to read those files and output them both [in order](https://github.com/kubernetes-sigs/kustomize/issues/202#issuecomment-483737500).
The secrets from our `.env` need to exist as a [kubernetes secret](https://www.macchaffee.com/blog/2022/k8s-secrets/), and our deployment would need to be [modified](https://github.com/kubernetes-sigs/kustomize/blob/master/examples/jsonpatch.md) to add the values from that secret into the environment of our deployment.
Let's tell kustomize to do that...

```sh
$ cat << 'EOF' >> kustomization.yaml
secretGenerator:
- name: api
  envs:
  - .env
patches:
- target:
    kind: Deployment
    name: api
  patch: |-
    - op: add
      path: /spec/template/spec/containers/0/envFrom
      value:
        - secretRef:
            name: api
EOF
```
Here you can see it's going to read the values of our `.env` and generate a
secret called `api`, and then patch our deployment to add an `envFrom` option to
our deployment.

With that done, we should be able to run the API inside kubernetes like this:

```sh
$ kustomize build | kubectl apply -f -
namespace/api created
secret/api-8b5g87tm8d created
service/api created
deployment.apps/api created
```
That ran the `kustomize build` command, piped it's output (the concatenated, sorted and transformed config files) into `kubectl apply` which sets this config as the new goal state for the [kubernetes reconciliation loop](https://www.oreilly.com/library/view/97-things-every/9781492050896/ch73.html).

With that done, we should be able to see the API running inside the cluster:
```sh
$ kubectl get pods -n api
NAME                   READY   STATUS    RESTARTS   AGE
api-76cffbdbf5-dk6dc   1/1     Running   0          60s
```

## Getting the UI going

Our UI is a client side [React](https://react.dev/) app. It's compiled into a fistfull of static files served up with Caddy.
We'll create our config pretty much the same, but this time it's simpler because we don't need env vars or secrets.

```sh
$ kubectl create namespace ui --output=yaml --dry-run=client > kubernetes/namespace.yaml
$ kubectl create deployment --namespace=ui --image=ghcr.io/sleepycat/fp4-ui:latest --replicas=1 --port=3000 ui --dry-run=client --output=yaml > kubernetes/deployment.yaml
$ kubectl create service clusterip --tcp=3000:3000 ui --output=yaml --dry-run=client > kubernetes/service.yaml
```
Now we'll make sure `kustomize` knows about those configs as well.
```sh
kustomize init --namespace=ui --resources=kubernetes/*
```
Now we can run the ui as well.

```sh
$ kustomize build | kubectl apply -f -
namespace/ui created
service/ui created
deployment.apps/ui created
```

## Routing traffic to our application

With both parts running, we want something listing at the cluster edge and directing traffic to the right containers.
We'll do that using Caddy again, but this time [Caddy ingress](https://github.com/caddyserver/ingress).

Caddy ingress uses [helm](https://helm.sh/), which I don't love much. We'll just render out the config and keep it so we can use it with kustomize.

Back in the project root lets run `mkdir ingress` and put it in there:

```sh
$ helm template --namespace=caddy-system --repo https://caddyserver.github.io/ingress/ --atomic mycaddy caddy-ingress-controller > ingress/caddy.yaml
```
With the config for caddy done, we just need to tell caddy how to route incoming traffic. We do this with two `ingress` rules.

```sh
$ kubectl create ingress --namespace=ui uirule --rule="/=ui:3000" --annotation="caddy.ingress.kubernetes.io/disable-ssl-redirect=true" --output=yaml --dry-run=client > ingress/slash.yaml
$ kubectl create ingress --namespace=api apirule --rule="/graphql=api:3000" --annotation="caddy.ingress.kubernetes.io/disable-ssl-redirect=true" --output=yaml --dry-run=client > ingress/graphql.yaml
```
Now we'll initialize kustomize here in the project root, and tell it how to find the config in the subfolders as well:  
```sh
$ kustomize init --resources=ingress/*,api,ui
```

## The full monty

With that config work done we can now bring up the entire system with a single
command. Kubernetes knows what we want running and will take action to restart
crashed pods while scooping up logs so they can be viewed centrally.

```sh
$ kustomize build | kubectl apply -f -
namespace/api unchanged
namespace/ui unchanged
serviceaccount/caddy-ingress-controller unchanged
clusterrole.rbac.authorization.k8s.io/caddy-ingress-controller-role unchanged
clusterrolebinding.rbac.authorization.k8s.io/caddy-ingress-controller-role-binding unchanged
configmap/caddy-ingress-controller-configmap unchanged
secret/api-8b5g87tm8d configured
service/api unchanged
service/mycaddy-caddy-ingress-controller configured
service/ui unchanged
deployment.apps/api unchanged
deployment.apps/mycaddy-caddy-ingress-controller unchanged
deployment.apps/ui unchanged
poddisruptionbudget.policy/mycaddy-caddy-ingress-controller configured
ingress.networking.k8s.io/apirule created
ingress.networking.k8s.io/uirule created
```
Running `minikube service list` will show you the local urls that you can use to connect to FP4.

In production, you'll be able to do something similar on [AKS](https://azure.microsoft.com/en-us/products/kubernetes-service), [EKS](https://aws.amazon.com/eks/), or [GKE](https://cloud.google.com/kubernetes-engine?hl=en). Heck, even [OKE](https://www.oracle.com/ca-en/cloud/cloud-native/kubernetes-engine/).
