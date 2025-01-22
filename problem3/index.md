# Problem3: Messy React

## 1. Interface Declaration

### Analyze original code

```typescript
interface WalletBalance {
  currency: string;
  amount: number;
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}
```

- `FormattedWalletBalance` repeats the same properties from `WalletBalance`, which violates DRY principle. It should use `extends` to inherit common properties
- `currency` type could be more specific than `string` (e.g., USDT, BTC)
- `formatted` is ambiguous - doesn't indicate what kind of formatting is applied

### Refactor version

```typescript
// define Currency enum for currency types
enum Currency {
  USDT = "USDT",
  BTC = "BTC",
  ETH = "ETH",
  NEO = "NEO",
}

interface WalletBalance {
  currency: Currency;
  amount: number;
}

// using extends (follows DRY principle)
interface FormattedWalletBalance extends WalletBalance {
  // clear naming
  formattedAmount: string;
}
```

## 2. Props

### Analyze original code

```typescript
interface Props extends BoxProps {

}
const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
```

- `Props` extends `BoxProps` without adding any additional properties
- redundant and violates the `DRY` principle: the `Props` type is declared twice, once in `React.FC<Props>` and again in `props: Props`
- `children` is redundant

### Refactor version

```typescript
// remove empty {}
// use type inference and use type intersection (&) for adding more propsin the future
type Props = BoxProps

// remove redundant code
const WalletPage: React.FC<Props> = (props) => {
```

## 3. Functions

### Analyze original code

```typescript
	const getPriority = (blockchain: any): number => {
	  switch (blockchain) {
	    case 'Osmosis':
	      return 100
	    case 'Ethereum':
	      return 50
	    case 'Arbitrum':
	      return 30
	    case 'Zilliqa':
	      return 20
	    case 'Neo':
	      return 20
	    default:
	      return -99
	  }
	}

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
		  const balancePriority = getPriority(balance.blockchain);
		  if (lhsPriority > -99) {
		     if (balance.amount <= 0) {
		       return true;
		     }
		  }
		  return false
		}).sort((lhs: WalletBalance, rhs: WalletBalance) => {
		  const leftPriority = getPriority(lhs.blockchain);
		  const rightPriority = getPriority(rhs.blockchain);
		  if (leftPriority > rightPriority) {
		    return -1;
		  } else if (rightPriority > leftPriority) {
		    return 1;
		  }
    });
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })
```

#### getPriority function

- using `any` type -> unsafe
- many numbers are hardcoded without clear meaning
- adding new blockchains requires modifying the function

#### sortedBalances function

- `lhsPriority` is not declared -> it should be `balancePriority`
- nested `if` statements are unnecessary and increase complexity
- `balance.amount <= 0` wrong logic
- not handle `equal priorities` case in sort function
- in `useMemo` dependency array, includes `prices` value but doesn't use it

#### formattedBalances function

- use `toFixed()` without parameters, doesn't specify decimal precision

### Refactor version

```typescript
// define Blockchain enum for blockchain types
enum Blockchain {
  Osmosis = 'Osmosis',
  Ethereum = 'Ethereum',
  Arbitrum = 'Arbitrum',
  Zilliqa = 'Zilliqa',
  Neo = 'Neo'
}

// mapping priority with blockchain
const BLOCKCHAIN_PRIORITY_MAPPING: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  [Blockchain.Ethereum]: 50,
  [Blockchain.Arbitrum]: 30,
  [Blockchain.Zilliqa]: 20,
  [Blockchain.Neo]: 20,
} as const;

// defint default priority for unknown blockchain
const DEFAULT_PRIORITY = -99;

const getPriority = (blockchain: Blockchain): number => {
  return BLOCKCHAIN_PRIORITIES[blockchain] ?? DEFAULT_PRIORITY;
};

// combine sorted and formatted in to one function to clearer data transformation flow and less code fragmentation
// improve performance by reducing the number of array iterations
const sortedAndFormattedBalances = useMemo(() => {
    return balances
      // simple filter amount function
      .filter(balance => balance.amount > 0)
      // simple sort function
      .sort((a, b) => {
        const priorityA = getPriority(a.blockchain);
        const priorityB = getPriority(b.blockchain);
        return priorityB - priorityA;
      })
      // format amounts
      .map(balance => ({
        ...balance,
        formatted: balance.amount.toFixed(2) // added decimal precision
      }));
  }, [balances]); // removed unused 'prices' dependency

```

## 4. JSX

### Analyze original code

```typescript
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow 
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}
```

- `key={index}` React Key anti-pattern, can cause rendering issues
- `const rows = sortedBalances.map` creates extra array in memory
- `prices[balance.currency]` unsafe, can return result in NaN

### Refactor version

```typescript
return (
    <div {...rest}>
      // render map directly
      {sortedBalances.map({currency, amount, formatted} => (
        <WalletRow
          // unique key
          key={`${currency}-${amount}`}
          className={classes.row}
          amount={amount}
          // add null check with ?? operator
          usdValue={(prices[currency] ?? 0) * amount}
          formattedAmount={formatted}
        />
      ))}
    </div>
  );
```

## 5. Full refactor code

```typescript
enum Currency {
  USDT = "USDT",
  BTC = "BTC",
  ETH = "ETH",
  NEO = "NEO",
}

enum Blockchain {
  Osmosis = 'Osmosis',
  Ethereum = 'Ethereum',
  Arbitrum = 'Arbitrum',
  Zilliqa = 'Zilliqa',
  Neo = 'Neo'
}

interface WalletBalance {
  currency: Currency;
  amount: number;
}

interface FormattedWalletBalance extends WalletBalance {
  formattedAmount: string;
}

type Props = BoxProps

const BLOCKCHAIN_PRIORITY_MAPPING: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  [Blockchain.Ethereum]: 50,
  [Blockchain.Arbitrum]: 30,
  [Blockchain.Zilliqa]: 20,
  [Blockchain.Neo]: 20,
} as const;

const DEFAULT_PRIORITY = -99;

const getPriority = (blockchain: Blockchain): number => {
  return BLOCKCHAIN_PRIORITIES[blockchain] ?? DEFAULT_PRIORITY;
};


const WalletPage: React.FC<Props> = (props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedAndFormattedBalances = useMemo(() => {
    return balances
      .filter(balance => balance.amount > 0)
      .sort((a, b) => {
        const priorityA = getPriority(a.blockchain);
        const priorityB = getPriority(b.blockchain);
        return priorityB - priorityA;
      })
      .map(balance => ({
        ...balance,
        formatted: balance.amount.toFixed(2)
      }));
  }, [balances]);

  return (
    <div {...props}>
      {sortedBalances.map({currency, amount, formatted} => (
        <WalletRow
          key={`${currency}-${amount}`}
          className={classes.row}
          amount={amount}
          usdValue={(prices[currency] ?? 0) * amount}
          formattedAmount={formatted}
        />
      ))}
    </div>
  );
}

```

- Note: define `BLOCKCHAIN_PRIORITY_MAPPING`, `DEFAULT_PRIORITY` and `getPriority` outside of the component are static, don't need to be recreated on each render and can be reuse accross of component

