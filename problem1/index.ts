// Three ways to sum to n

// Approach 1: Using a for loop
var sum_to_n_a = (n: number): number => {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
};

// Approach 2: Using Array.from() and Array.reduce()
var sum_to_n_b = (n: number): number => {
  return Array.from({ length: n }, (_, index) => index + 1).reduce(
    (sum, current) => sum + current,
    0
  );
};

// Approach 3: Using the formula: n * (n + 1) / 2
var sum_to_n_c = (n: number): number => {
  return (n * (1 + n)) / 2;
};
