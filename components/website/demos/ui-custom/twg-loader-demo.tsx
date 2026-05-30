import { TWGLoader } from "@/components/ui-custom/twg-loader";

export default function TWGLoaderDemo() {
	return <TWGLoader size="large" label="Loading" />;
}

export function TWGLoaderDemoSizes() {
	return (
		<div className="flex items-center gap-6">
			<TWGLoader size="small" label="Loading small" />
			<TWGLoader size="medium" label="Loading medium" />
			<TWGLoader size="large" label="Loading large" />
			<TWGLoader size="xlarge" label="Loading xlarge" />
		</div>
	);
}

export function TWGLoaderDemoOnDark() {
	return (
		<div className="flex items-center justify-center rounded-xl bg-[#111213] p-10">
			{/* The dot masks read `currentColor`, so match the loader's text
			    color to the chrome behind it instead of the page surface. */}
			<TWGLoader
				size="xlarge"
				label="Loading Teamwork Graph"
				className="text-[#111213]"
			/>
		</div>
	);
}
