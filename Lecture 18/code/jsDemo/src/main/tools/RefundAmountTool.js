export class RefundAmountTool {
  constructor(toolTracker) { this.toolTracker = toolTracker; }
  static description = "Get the approved refund amount for an order.\n            Use this when the user asks how much money\n            will be refunded.";
  getRefundAmount(orderId) {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const orders = {
      "ORD-103": "The approved refund amount for ORD-103 is INR 4999.",
      "ORD-101": "No refund has been approved for ORD-101.",
      "ORD-102": "No refund has been approved for ORD-102."
};
    const result = orders[normalizedOrderId] ?? "Refund information not found.";
    this.toolTracker.record('getRefundAmount', normalizedOrderId, result);
    return result;
  }
}
