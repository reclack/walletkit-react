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
	type ConnectProps,
	type ReclackConnectElement,
} from '@reclack/walletkit/element'

export type { ConnectProps } from '@reclack/walletkit/element'

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
