declare module "notifications-node-client" {
  export interface EmailPersonalisation {
    [key: string]: string | number | boolean
  }

  export interface EmailRequest {
    personalisation?: EmailPersonalisation
    reference?: string
    emailReplyToId?: string
  }

  export class NotifyClient {
    constructor(urlBase: string, apiKey: string)

    sendEmail(
      templateId: string,
      emailAddress: string,
      options?: EmailRequest,
    ): Promise<unknown>

    sendSms(
      templateId: string,
      phoneNumber: string,
      options?: EmailRequest,
    ): Promise<unknown>

    sendLetter(
      templateId: string,
      options?: EmailRequest,
    ): Promise<unknown>
  }
}
