import Image from "next/image";

export function RovoAppBrand() {
	return (
		<div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-text">
			<span
				aria-hidden
				data-icon="inline-start"
				className="flex size-4 items-center justify-center"
			>
				<Image
					src="/1p/rovo.svg"
					alt=""
					width={16}
					height={16}
				/>
			</span>
			<span className="font-semibold">Rovo</span>
		</div>
	);
}
