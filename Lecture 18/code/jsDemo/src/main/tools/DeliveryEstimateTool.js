export class DeliveryEstimateTool {
  constructor(toolTracker) { this.toolTracker = toolTracker; }
  static description = "Get the expected delivery date for an order.\n            Use this when the user asks when the order will arrive,\n            when it will be delivered, or asks for a delivery estimate.";
  getDeliveryEstimate(orderId) {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const orders = {
      "ORD-101": "Order ORD-101 is expected to be delivered on 15 October 2026.",
      "ORD-102": "Order ORD-102 has already been delivered.",
      "ORD-103": "Order ORD-103 has already been delivered."
};
    const result = orders[normalizedOrderId] ?? "Delivery information not found.";
    this.toolTracker.record('getDeliveryEstimate', normalizedOrderId, result);
    return result;
  }
}
