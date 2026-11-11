# @reclack/walletkit-react

The Reclack wallet picker as a React component. Connect a wallet, read an
address, read a balance, on EVM chains and on Solana.

```sh
npm install @reclack/walletkit @reclack/walletkit-react
```

`@reclack/walletkit` is a peer dependency, so install both. React 18 or newer.

## Usage

```tsx
import { ReclackConnect } from '@reclack/walletkit-react'

export function ConnectButton () {
  const [open, setOpen] = useState(false)

  return open ? (
    <ReclackConnect
      variant="modal"
      family="evm"
      chainId={8453}
      intent={['address']}
      onConnect={({ address }) => {
        setAddress(address)
        setOpen(false)
      }}
      onCancel={() => setOpen(false)}
      onError={(message) => toast(message)}
    />
  ) : (
    <button onClick={() => setOpen(true)}>Connect wallet</button>
  )
}
```

`variant="modal"` opens over the page and closes itself once a wallet
connects, so mounting it is how you open it. `variant="inline"` renders the
wallet list in place.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'inline' \| 'modal'` | `'inline'` | A list on the page, or the picker over it |
| `family` | `'evm' \| 'svm'` | `'evm'` | Which wallets to offer |
| `chainId` | `number` | none | Require this chain, switching the wallet if needed |
| `intent` | `Array<'address' \| 'balance'>` | `['address']` | What to return |
| `keepAlive` | `boolean` | `false` | Stay connected after resolving |
| `assetBase` | `string` | `/images/` | Where the wallet logos are served from |
| `apiUrl` | `string` | Reclack's | A different deployment, such as a sandbox |
| `kit` | `WalletKit` | its own | A kit to share, see below |
| `request` | `ConnectRequest` | `{ intent: ['address'] }` | An intent carrying assets |
| `theme` | `WalletKitTheme` | none | Colours, radius and type. See [Theming](#theming) |
| `className`, `style` | | | Applied to the host element |

## Theming

```tsx
<ReclackConnect
  theme={{
    mode: 'system',               // 'light' | 'dark' | 'system'
    brand: '#ff6600',             // worn by the primary action
    radius: '14px',
    fontFamily: 'Inter, sans-serif',
    dark: { surface: '#000000' }, // applied on top, in dark only
  }}
/>
```

The four values most pages want also have a prop each, which build the same
theme:

| Prop | Theme field | Type | Default |
| --- | --- | --- | --- |
| `themeMode` | `mode` | `'light' \| 'dark' \| 'system'` | `'system'` |
| `brand` | `brand` | `string`, as `#rrggbb` | Reclack's |
| `radius` | `radius` | `string` | `10px` |
| `fontFamily` | `fontFamily` | `string` | inherited |

**A `theme` wins over the four.** Passing `theme`, or sharing a `kit` that
already carries one, makes them ignored and uses the theme whole, so a page
that themed its kit does not have to theme every picker as well.

Colours must be `#rrggbb`. Anything else is ignored and the default stands, so
a value from an API response can never end up inside a style.

### Callbacks

| Prop | Called with |
| --- | --- |
| `onConnect` | `{ address, chainId, walletId, name, family, balances }` |
| `onCancel` | nothing, the person closed the picker |
| `onError` | a message a person can read |

Handlers are held in a ref, so a parent that rebuilds them on every render
does not tear the listeners down and put them back.

## Reading a balance

`intent` takes a list because an address and a balance are not alternatives.
Asking for a balance needs an asset to be a balance of, which is more than an
attribute can carry, so pass the whole request:

```tsx
<ReclackConnect
  family="evm"
  request={{
    intent: ['address', 'balance'],
    assets: [{ family: 'evm', chainId: 8453, token: USDC, decimals: 6 }],
  }}
  onConnect={({ address, balances }) => { /* ... */ }}
/>
```

Amounts come back as `bigint` in the asset's smallest unit. `formatUnits` from
`@reclack/walletkit` renders them.

## Sharing a kit

Each picker builds its own connection layer unless given one. A page with
several pickers should share, since discovery means a window listener and a
catalogue fetch.

```tsx
import { createWalletKit } from '@reclack/walletkit'

const kit = createWalletKit()          // module scope, made once

<ReclackConnect kit={kit} family="evm" />
```

Themes stay per picker even when the kit is shared, so one kit can serve a
light picker in a panel and a dark one in a drawer.

## Next.js and other frameworks that render on the server

Add `'use client'` to the file that renders the component. `@reclack/walletkit`
itself is safe to import on a server: it touches no browser API until
something subscribes, and registering the custom element is skipped where
there is no `customElements`.

## Preact

This package, unchanged. `preact/compat` handles the rest.

## TypeScript

Types ship with the package.

```ts
import type { ConnectProps } from '@reclack/walletkit-react'
import type { ConnectResult, WalletKit } from '@reclack/walletkit'
```

## Licence

MIT.
