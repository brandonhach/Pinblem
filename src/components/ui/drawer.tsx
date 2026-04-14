import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';

const Drawer = ({
	shouldScaleBackground = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
	<DrawerPrimitive.Root
		shouldScaleBackground={shouldScaleBackground}
		{...props}
	/>
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Overlay
		ref={ref}
		className={cn('fixed inset-0 z-50 bg-black/80', className)}
		{...props}
	/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/**
 * On iOS Safari, when the keyboard opens:
 *   - The visual viewport shrinks in HEIGHT
 *   - The visual viewport's offsetTop may increase if the page scrolls
 *   - But `position: fixed` elements stay relative to the LAYOUT viewport
 *     (window.innerHeight), so `bottom: 0` ends up BEHIND the keyboard.
 *
 * Fix: compute the actual keyboard height as
 *   window.innerHeight - visualViewport.height - visualViewport.offsetTop
 * and use that as the `bottom` offset so the drawer sits above the keyboard.
 * Also cap maxHeight to visualViewport.height so it never overflows.
 */
function useVisualViewport() {
	const getValues = () => {
		const vv = window.visualViewport;
		const height = vv?.height ?? window.innerHeight;
		const offsetTop = vv?.offsetTop ?? 0;
		const keyboardOffset = Math.max(0, window.innerHeight - height - offsetTop);
		return { height, keyboardOffset };
	};

	const [vp, setVp] = React.useState(
		typeof window !== 'undefined'
			? getValues
			: () => ({ height: 800, keyboardOffset: 0 }),
	);

	React.useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => setVp(getValues());
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);
		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	}, []);

	return vp;
}

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
	const { height, keyboardOffset } = useVisualViewport();

	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerPrimitive.Content
				ref={ref}
				className={cn(
					'fixed inset-x-0 z-50 mt-24 flex flex-col rounded-t-[10px] border bg-background overflow-hidden',
					className,
				)}
				style={{
					// Lift the drawer above the keyboard. keyboardOffset is the
					// real keyboard height: window.innerHeight − visualViewport.height − offsetTop.
					bottom: keyboardOffset,
					maxHeight: height * 0.92,
					...style,
				}}
				{...props}>
				<div className='mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted' />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
});
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
		{...props}
	/>
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('mt-auto flex flex-col gap-2 p-4', className)}
		{...props}
	/>
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Title
		ref={ref}
		className={cn(
			'text-lg font-semibold leading-none tracking-tight',
			className,
		)}
		{...props}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Description
		ref={ref}
		className={cn('text-sm text-muted-foreground', className)}
		{...props}
	/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
