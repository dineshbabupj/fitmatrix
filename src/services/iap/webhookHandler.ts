export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'NON_RENEWING_PURCHASE';

export interface RevenueCatWebhookPayload {
  event: {
    type: RevenueCatEventType;
    id: string;
    app_id: string;
    app_user_id: string;
    product_id: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    environment: 'PRODUCTION' | 'SANDBOX';
  };
}

export const webhookHandler = {
  /**
   * Process incoming RevenueCat Webhook Payload
   */
  handleWebhookEvent: async (payload: RevenueCatWebhookPayload): Promise<{ processed: boolean; action: string }> => {
    const { type, app_user_id, product_id } = payload.event;
    console.log(`[RevenueCat Webhook] Event Received: ${type} for User ${app_user_id} (${product_id})`);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'NON_RENEWING_PURCHASE':
        return { processed: true, action: `Granted entitlement for product ${product_id} to user ${app_user_id}` };

      case 'CANCELLATION':
      case 'EXPIRATION':
        return { processed: true, action: `Revoked entitlement for product ${product_id} from user ${app_user_id}` };

      default:
        return { processed: false, action: `Unhandled event type ${type}` };
    }
  },
};
