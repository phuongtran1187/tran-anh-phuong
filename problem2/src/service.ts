// Types
interface PriceData {
  currency: string;
  date: string;
  price: number;
}

interface CurrencySwap {
  fromCurrency: string;
  toCurrency: string;
}

// Constants
const API_URL = "https://interview.switcheo.com/prices.json";
const DECIMAL_PLACES = 6;
const USD_DECIMALS = 2;

// State
let prices: PriceData[] = [];
let fromAmount = "";
let toAmount = "";
let fromCurrency = "ETH";
let toCurrency = "USD";

// Icon Handling
const getTokenIconPath = (symbol: string): string => {
  return `public/tokens/${symbol.toLowerCase()}.svg`;
};

const updateTokenIcon = (type: "from" | "to", currency: string): void => {
  const iconId = type === "from" ? "fromTokenIcon" : "toTokenIcon";
  const iconElement = document.getElementById(iconId) as HTMLImageElement;

  if (iconElement) {
    iconElement.src = getTokenIconPath(currency);
    iconElement.alt = currency;
    iconElement.onerror = () => {
      iconElement.style.display = "none";
    };
  }
};

// Main Functions
const getLatestPrice = (currency: string): number | null => {
  const currencyPrices = prices.filter((p) => p.currency === currency);
  if (currencyPrices.length === 0) return null;

  return currencyPrices.reduce((latest, current) =>
    new Date(current.date) > new Date(latest.date) ? current : latest
  ).price;
};

const getUsdValue = (amount: string, currency: string): string => {
  if (!amount || isNaN(parseFloat(amount))) return "≈ $0.00";
  const price = getLatestPrice(currency);
  if (!price) return "≈ $0.00";

  const usdValue = parseFloat(amount) * price;
  return `≈ $${usdValue.toFixed(USD_DECIMALS)}`;
};

const calculateSwapAmount = (
  amount: number,
  { fromCurrency, toCurrency }: CurrencySwap
): number | null => {
  const fromPrice = getLatestPrice(fromCurrency);
  const toPrice = getLatestPrice(toCurrency);

  if (!fromPrice || !toPrice) return null;
  return (amount * fromPrice) / toPrice;
};

const updateUsdValues = (): void => {
  const fromUsdValue = document.getElementById("fromUsdValue");
  const toUsdValue = document.getElementById("toUsdValue");

  if (fromUsdValue) {
    fromUsdValue.textContent = getUsdValue(fromAmount, fromCurrency);
  }

  if (toUsdValue) {
    toUsdValue.textContent = getUsdValue(toAmount, toCurrency);
  }
};

const updateToAmount = (): void => {
  const toInput = document.getElementById("toAmount") as HTMLInputElement;

  if (!fromAmount) {
    toInput.value = "";
    toAmount = "";
    updateUsdValues();
    return;
  }

  const amount = calculateSwapAmount(parseFloat(fromAmount), {
    fromCurrency,
    toCurrency,
  });

  toAmount = amount ? amount.toFixed(DECIMAL_PLACES) : "";
  toInput.value = toAmount;
  updateUsdValues();
};

const updatePriceInfo = (): void => {
  const priceInfo = document.getElementById("priceInfo");
  if (!priceInfo) return;

  const fromPrice = getLatestPrice(fromCurrency);
  const toPrice = getLatestPrice(toCurrency);

  if (!fromPrice || !toPrice) {
    priceInfo.innerHTML = "<span>Price information unavailable</span>";
    return;
  }

  const rate = (fromPrice / toPrice).toFixed(DECIMAL_PLACES);
  priceInfo.innerHTML = `
      <span>1 ${fromCurrency} = ${rate} ${toCurrency}</span>
  `;
};

const showMessage = (message: string, type: "error" | "success"): void => {
  const statusMessage = document.getElementById("statusMessage");
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} visible`;

  setTimeout(() => {
    statusMessage.className = "status-message";
  }, 3000);
};

const setLoading = (isLoading: boolean): void => {
  const submitButton = document.getElementById(
    "submitButton"
  ) as HTMLButtonElement;

  if (isLoading) {
    submitButton.classList.add("loading");
    submitButton.disabled = true;
  } else {
    submitButton.classList.remove("loading");
    submitButton.disabled = false;
  }
};

const handleFromAmountChange = (e: Event): void => {
  const input = e.target as HTMLInputElement;
  const value = input.value;

  if (value === "" || /^\d*\.?\d*$/.test(value)) {
    fromAmount = value;
    updateToAmount();
  }
};

const handleCurrencyChange = (type: "from" | "to", value: string): void => {
  if (type === "from") {
    fromCurrency = value;
    updateTokenIcon("from", value);
  } else {
    toCurrency = value;
    updateTokenIcon("to", value);
  }
  updateToAmount();
  updatePriceInfo();
};

const handleSwap = (): void => {
  const tempCurrency = fromCurrency;
  fromCurrency = toCurrency;
  toCurrency = tempCurrency;

  const fromSelect = document.getElementById(
    "fromCurrency"
  ) as HTMLSelectElement;
  const toSelect = document.getElementById("toCurrency") as HTMLSelectElement;
  fromSelect.value = fromCurrency;
  toSelect.value = toCurrency;

  const tempAmount = fromAmount;
  fromAmount = toAmount;
  toAmount = tempAmount;

  const fromInput = document.getElementById("fromAmount") as HTMLInputElement;
  const toInput = document.getElementById("toAmount") as HTMLInputElement;
  fromInput.value = fromAmount;
  toInput.value = toAmount;

  updateTokenIcon("from", fromCurrency);
  updateTokenIcon("to", toCurrency);
  updatePriceInfo();
  updateUsdValues();
};

const validateForm = (): boolean => {
  if (!fromAmount || isNaN(parseFloat(fromAmount))) {
    showMessage("Please enter a valid amount", "error");
    return false;
  }

  if (parseFloat(fromAmount) <= 0) {
    showMessage("Amount must be greater than 0", "error");
    return false;
  }

  const fromPrice = getLatestPrice(fromCurrency);
  const toPrice = getLatestPrice(toCurrency);

  if (!fromPrice || !toPrice) {
    showMessage("Price information unavailable", "error");
    return false;
  }

  return true;
};

const handleSubmit = async (e: Event): Promise<void> => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    showMessage("Swap executed successfully!", "success");

    fromAmount = "";
    toAmount = "";
    const fromInput = document.getElementById("fromAmount") as HTMLInputElement;
    const toInput = document.getElementById("toAmount") as HTMLInputElement;
    fromInput.value = "";
    toInput.value = "";
    updateUsdValues();
  } catch (error) {
    showMessage("Failed to execute swap. Please try again.", "error");
  } finally {
    setLoading(false);
  }
};

const handleEventListeners = (): void => {
  const fromInput = document.getElementById("fromAmount") as HTMLInputElement;
  fromInput.addEventListener("input", handleFromAmountChange);

  const fromSelect = document.getElementById(
    "fromCurrency"
  ) as HTMLSelectElement;
  const toSelect = document.getElementById("toCurrency") as HTMLSelectElement;

  fromSelect.addEventListener("change", (e: Event) =>
    handleCurrencyChange("from", (e.target as HTMLSelectElement).value)
  );

  toSelect.addEventListener("change", (e: Event) =>
    handleCurrencyChange("to", (e.target as HTMLSelectElement).value)
  );

  const swapButton = document.getElementById("swapButton");
  swapButton?.addEventListener("click", handleSwap);

  const form = document.getElementById("swapForm");
  form?.addEventListener("submit", handleSubmit);
};

const populateCurrencySelects = (): void => {
  const currencies = [...new Set(prices.map((p) => p.currency))].sort();

  const fromSelect = document.getElementById(
    "fromCurrency"
  ) as HTMLSelectElement;
  const toSelect = document.getElementById("toCurrency") as HTMLSelectElement;

  currencies.forEach((currency) => {
    fromSelect.add(new Option(currency, currency));
    toSelect.add(new Option(currency, currency));
  });

  fromSelect.value = fromCurrency;
  toSelect.value = toCurrency;

  updateTokenIcon("from", fromCurrency);
  updateTokenIcon("to", toCurrency);
};

export const initApp = async (): Promise<void> => {
  try {
    const fromInput = document.getElementById("fromAmount") as HTMLInputElement;
    const toInput = document.getElementById("toAmount") as HTMLInputElement;
    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";
    fromAmount = "";
    toAmount = "";

    const response = await fetch(API_URL);
    prices = await response.json();
    handleEventListeners();
    populateCurrencySelects();
    updatePriceInfo();
    updateUsdValues();
  } catch (error) {
    showMessage("Failed to fetch prices. Please try again later.", "error");
  }
};
