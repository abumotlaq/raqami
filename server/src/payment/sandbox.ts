import { env } from "../env.js";

// Payment sandbox: stands in for a real payment gateway (Payment Sandbox actor).
// No money moves. It answers the way a gateway would:
//   success -> "paid"     the payment went through
//   failed  -> "failed"   the payment was declined
//   pending -> "pending"  no answer yet; the confirmation arrives later,
//                         the way a real gateway would call a webhook.

export const paymentOutcomes = ["success", "failed", "pending"] as const;
export type PaymentOutcome = (typeof paymentOutcomes)[number];
export type PaymentResult = "paid" | "failed" | "pending";

type ConfirmationHandler = (orderId: number, result: "paid" | "failed") => Promise<void>;

let onConfirmation: ConfirmationHandler = async () => {};

// Registers the function the sandbox calls when a pending payment is confirmed.
export function setConfirmationHandler(handler: ConfirmationHandler) {
  onConfirmation = handler;
}

function isOutcome(value: unknown): value is PaymentOutcome {
  return paymentOutcomes.includes(value as PaymentOutcome);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Confirms a pending payment as paid after the configured delay.
export function confirmLater(orderId: number) {
  const timer = setTimeout(() => {
    onConfirmation(orderId, "paid").catch((err) => console.error("Payment confirmation failed", err));
  }, env.payment.pendingMs);
  timer.unref();
}

export async function charge(payment: {
  orderId: number;
  amount: string;
  outcome?: PaymentOutcome;
}): Promise<PaymentResult> {
  const outcome =
    payment.outcome ?? (isOutcome(env.payment.defaultOutcome) ? env.payment.defaultOutcome : "success");

  await wait(300); // a gateway call is never instant

  if (outcome === "failed") return "failed";
  if (outcome === "pending") {
    confirmLater(payment.orderId);
    return "pending";
  }
  return "paid";
}
