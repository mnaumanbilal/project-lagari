let orderPlaced = false;

export function markCheckoutPlaced() {
  orderPlaced = true;
}

export function wasCheckoutPlaced() {
  return orderPlaced;
}

export function resetCheckoutPlaced() {
  orderPlaced = false;
}
