# Backend API

## Policy Drivers

* In the Government of Canada [APIs are mandatory](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#toc04:~:text=expose%20services%2C%20including%20existing%20ones%2C%20through%20APIs).
* Departments are required to [consume the APIs they build](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html#:~:text=Consume%20what%20you%20build) in order to validate the API is usable.
* "[design systems as highly modular and loosely coupled services](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#:~:text=design%20systems%20as%20highly%20modular%20and%20loosely%20coupled%20services)"
* "[ensure automated testing occurs](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#:~:text=ensure%20automated%20testing%20occurs)"
 

## Architectural Decisions

### Using [GraphQL](https://graphql.org)

While The TBS Standard on APIs says that APIs should use REST "[by default](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html#:~:text=APIs%20must%20follow%20the%20RESTful%20model%20by%20default.)".
Here we are exercising the latitude to go beyond the default (it's been confirmed with TBS this is allowed) and use GraphQL because [it allows for composition](https://www.apollographql.com/docs/federation/federated-types/composition/). Services built with composition in mind turn themselves into building blocks that can be combined in various ways to allow the organization as a whole to quickly adapt to shifting demands (hence calls for a "[composable enterprise](https://www.gartner.com/en/doc/465932-future-of-applications-delivering-the-composable-enterprise)").

GraphQL's design aligns with [published patterns for secure input handling](https://www.usenix.org/system/files/login/articles/login_spring17_08_bratus.pdf).
These design patterns (like the "recognizer pattern" and GraphQL implementation diagram below) are normally only used by defense contractors and security companies, requiring custom parser development, sophisticated developers and big budgets.

![Langsec's recognizer pattern and graphql](langsec-recognizer-pattern.svg)

Having these patterns appear in a relatively mainstream technology creates an opportunity to democratize these patterns.
Using a GraphQL parser as the front door of this application has powerful security implications as described by [Momot, et al. (2016)](https://langsec.org/papers/langsec-cwes-secdev2016.pdf):

> A correctly written parser is essentially equivalent to an application firewall.

By adopting GraphQL along with some opinionated usage patterns (avoiding generic "String" inputs), it is possible to build APIs that function like a [cross-domain solution](https://www.canada.ca/en/services/defence/nationalsecurity/sensitive-technology-list.html#:~:text=Cross%20domain%20solutions,from%20connected%20networks.), something this project is hoping to pioneer.

Alternatives considered: ReST APIs (standard patterns tend to be a security free-for-all, design is backend focused, mapping urls > sql > json, rather than solving problems that block API users from iterating quickly)

### Using Javascript

JavaScript is built into every browser by default. It can also be used as a backend programming language if you install a JavaScript runtime on the server, allowing for a single programming language to be used for the majority of the application.
The selection of JavaScript as the implementation language serves a few purposes:
* Smaller team size: [Once considered mythical](https://frontendmasters.com/guides/front-end-handbook/2017/practice/myth.html#:~:text=given%20that%20JavaScript%20has%20infiltrated%20all%20layers%20of%20a%20technology%20stack%20(e.g.%20React%2C%20node.js%2C%20express%2C%20couchDB%2C%20gulp.js%20etc...)%20finding%20a%20full%2Dstack%20JS%20developer%20who%20can%20code%20the%20front%2Dend%20and%20back%2Dend%20is%20becoming%20less%20mythical.%20Typically%2C%20these%20full%20stack%20developers%20only%20deal%20with%20JavaScript.), full stack development is achievable wherever you can use a single language for both frontend and backend. This allows for smaller, more agile teams; important for making the product team model viable.
* Lower risk: The use of memory safe languages represents a [significant risk reduction](https://www.memorysafety.org/docs/memory-safety/#how-common-are-memory-safety-vulnerabilities), and even among memory safe languages [JavaScript compares favourably](https://securityflawheatmap.veracode.com/p/1).
* Modern security features: [Language-level features that systemically prevent SQL injection](https://mikewilliamson.wordpress.com/2018/10/22/tagged-template-literals-and-the-hack-that-will-never-go-away/) has been included in JavaScript since 2015. The Python community has taken note and has [recently adopted same thing](https://realpython.com/python-t-strings/) for the same reasons. Similar protections that allow for safe input handling are not yet built into other languages, requiring the use of Web Application Firewalls to prevent "unsafe" inputs from reaching applications unable to handle inputs properly.

Alternatives considered: Python/Java (Having a different language on the backend creates a hard split in the team between backend and frontend dev, leading to larger teams over all which makes product teams extremely expensive)

### Using Deno as the JavaScript Runtime

JavaScript Runtimes execute JavaScript code on the Server. [Nodejs](https://nodejs.org/en) is the pioneer in this space, but new options like [Bun](https://bun.com/) (more performance focused) and [Deno](https://deno.com) (more security focused) have brought competition to this space.
This API is built with [Deno](https://deno.com/) the more security focused option, which [sandboxes code by default](https://deno.com/blog/deno-protects-npm-exploits#secure-by-default) to protect against supply-chain attacks and other hacks. These security features are not yet built into other languages.

Deno also allows developers to reduce the number of dependencies by including many common tools like a testing framework, which allows running tests with Deno, instead of needing to install a separate testing framework like [Jest](https://jestjs.io/) along with it's entire [dependency tree](https://npmgraph.js.org/?q=jest). This results in a significant 
reduction in attack-surface.

### Using Sqlite

This API is assumed to be a read-heavy workload with low-to-no concurrent writes. This usage profile allows the use of [Sqlite for a simple, operations-free database](https://dev.to/shayy/everyone-is-wrong-about-sqlite-4gjf). This approach means that backups can be handled by [simple filesync to S3](https://litestream.io/) for near zero cost.

Alternatives considered: [CloudNativePG](https://cloudnative-pg.io/) (operationally complicated), [Rqlite](https://rqlite.io/) (looks promising, didn't love the JavaScript client. Still worth exploring.)

## Debugging Notifications

Sometimes it's tricky to figure out how to get a notification sent via notify. Sending a few with `curl` can help clarify what is going on since the [node client](https://docs.notifications.service.gov.uk/node.html#node-js-client-documentation) is simply a wrapper around the [REST API](https://documentation.notification.canada.ca/en/start.html).
This is an example of how use curl
```sh
curl -H 'Content-Type: application/json' \
 -H 'Authorization: ApiKey-v1 gcntfy-my_test_key-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' \
 -d '{"template_id":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","email_address":"test@example.com","personalisation":{"myvariable":"foo"}}' \
 'https://api.notification.canada.ca/v2/notifications/email'
```
## Exploring rate limiting

This functionality is covered by our automated tests but it is occasionally useful to poke at this manually.

### Manual testing mutation.verify

Install the [ulid](https://github.com/technosophos/ulid) tool at the command line with `go install github.com/technosophos/ulid@latest`. Then you can trigger the rate limiting with this:

```sh
 for i in {1..20}; do curl 'http://localhost:3000/graphql' -H "content-type: application/json" -d "$(printf '{"query":"mutation ($token: ULID!){verify(token: $token)}","variables":{"token":"%s"}}' "$(ulid)")"; done
```

### Manual testing mutation.login

For testing the login function you will want to install the [faker-cli](https://github.com/dacort/faker-cli) with `pip install --user faker-cli` (so it installs the binary in ~/.local/bin) and then use it to generate fake emails in a loop:
```sh
 for i in {1..20}; do curl 'http://localhost:3000/graphql' -H "content-type: application/json" -d "$(printf '{"query":"mutation ($email: EmailAddress!){login(email: $email)}","variables":{"email":"%s"}}' "$(fake -f json email | jq -r .email)")"; done
```

