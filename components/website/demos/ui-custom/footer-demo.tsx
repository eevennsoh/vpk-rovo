"use client";

import { Footer } from "@/components/ui-custom/footer";

export default function FooterDemo() {
	return <Footer />;
}

export function FooterDemoDefault() {
	return <Footer />;
}

export function FooterDemoCustomText() {
	return <Footer>AI-generated content may contain errors.</Footer>;
}

export function FooterDemoNoIcon() {
	return <Footer hideIcon>Uses AI. Verify results.</Footer>;
}

export function FooterDemoKeyboardHints() {
	return (
		<Footer hideIcon>
			<span>
				<kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to navigate
			</span>
			<span aria-hidden>•</span>
			<span>
				<kbd className="font-sans">↵</kbd> Enter to select
			</span>
			<span aria-hidden>•</span>
			<span>Esc to skip</span>
		</Footer>
	);
}
