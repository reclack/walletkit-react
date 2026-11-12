import {
	createElement,
	useEffect,
	useLayoutEffect,
	useRef,
	type CSSProperties,
} from 'react'

import {
	attributesOf,
	EVENTS,
	networkAttributesOf,
	type ConnectProps,
	type NetworkProps,
	type ReclackConnectElement,
	type ReclackNetworkElement,
} from '@reclack/walletkit/element'
import type { WalletKitTheme } from '@reclack/walletkit'

export type { ConnectProps, NetworkProps } from '@reclack/walletkit/element'

/**
 * The Reclack wallet picker, as a React component.
 *
 * The element underneath is `<reclack-connect>`, because a custom element's
 * tag must be lowercase and contain a hyphen. That is the HTML spec, not a
 * style choice, and nobody writing React should have to know it. Hence this:
 * a component name that reads like every other component on the page,
 * camelCase props, and callbacks instead of `addEventListener`.
 *
 * Its own package rather than an entry in the kit, so the kit itself depends
 * on no framework at all and a host installs only the one it uses.
 *
 * Written with `createElement` rather than JSX, so this ships as plain
 * JavaScript with no transform of its own and no JSX namespace to augment.
 */
export function ReclackConnect (
	props: ConnectProps & { className?: string; style?: CSSProperties },
) {
	const ref = useRef<ReclackConnectElement>(null)

	// A layout effect, not a passive one, and the difference matters. The
	// element defers its first render to the end of the task; a layout
	// effect runs inside the same commit, so the kit is in place before
	// then and the element never builds one of its own to throw away.
	//
	// The three settings that carry more than a string are properties, not
	// attributes: an attribute holds a string, and a kit is not one.
	useLayoutEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		if (props.kit) {
			element.kit = props.kit
		}
		if (props.request) {
			element.request = props.request
		}
		element.theme = props.theme
	}, [props.kit, props.request, props.theme])

	// Held in a ref so a parent that rebuilds its handlers each render does
	// not tear the listeners down and put them back on every keystroke
	// elsewhere on the page.
	const handlers = useRef(props)
	handlers.current = props

	useEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		const listeners = Object.entries(EVENTS).map(([event, prop]) => {
			const listener = (raw: Event) => {
				const detail = (raw as CustomEvent).detail
				if (prop === 'onError') {
					handlers.current.onError?.(detail?.message ?? 'Could not connect.')
				} else if (prop === 'onConnect') {
					handlers.current.onConnect?.(detail)
				} else {
					handlers.current.onCancel?.()
				}
			}
			element.addEventListener(event, listener)
			return [event, listener] as const
		})
		return () => {
			for (const [event, listener] of listeners) {
				element.removeEventListener(event, listener)
			}
		}
	}, [])

	return createElement('reclack-connect', {
		ref,
		className: props.className,
		style: props.style,
		...attributesOf(props),
	})
}

/**
 * The chain picker, as a component.
 *
 * Takes `networks` and `value` and answers with `onChange`, which is what a
 * React component is expected to do. Using the element directly works, but
 * means a ref and a listener in an effect for something that is a prop in
 * every other control on the form.
 */
export function ReclackNetwork (
	props: NetworkProps & {
		/** A theme carrying more than the four attributes can hold. */
		theme?: WalletKitTheme
		className?: string
		style?: CSSProperties
	},
) {
	const ref = useRef<ReclackNetworkElement>(null)

	// A property, not an attribute: a theme is an object, and a per-mode
	// override is more than a string can carry.
	useLayoutEffect(() => {
		if (ref.current) {
			ref.current.theme = props.theme
		}
	}, [props.theme])

	// Held in a ref so a parent rebuilding its handler every render does not
	// tear the listener down and put it back each time.
	const handler = useRef(props.onChange)
	handler.current = props.onChange

	useEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		const listener = (raw: Event) => {
			handler.current?.((raw as CustomEvent<{ network: string }>).detail.network)
		}
		element.addEventListener('change', listener)
		return () => element.removeEventListener('change', listener)
	}, [])

	return createElement('reclack-network', {
		ref,
		className: props.className,
		style: props.style,
		...networkAttributesOf(props),
	})
}
