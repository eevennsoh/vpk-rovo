"use client";

import Image from "next/image";
import { useRovoChat } from "@/app/contexts";
import { token } from "@/lib/tokens";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

interface FloatingRovoButtonProps {
	product: Product;
	embedded?: boolean;
	forceVisible?: boolean;
}

export default function FloatingRovoButton({
	product,
	embedded = false,
	forceVisible = false,
}: Readonly<FloatingRovoButtonProps>) {
	const { isOpen, openChat } = useRovoChat();

	if (!forceVisible && (embedded || product === "rovo" || isOpen)) {
		return null;
	}

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `
          .floating-rovo-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 48px;
            height: 48px;
            border-radius: ${token("radius.xxlarge")};
            background-color: ${token("color.background.neutral.bold")};
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-origin: center;
            will-change: transform;
            transition:
              transform var(--duration-medium) var(--ease-out),
              background-color var(--duration-medium) var(--ease-out);
            z-index: 500;
            box-shadow: ${token("elevation.shadow.overlay")};
          }

          .floating-rovo-button:hover {
            transform: scale(1.125);
          }

          .floating-rovo-button img {
            width: 24px;
            height: 24px;
            pointer-events: none;
          }
        `,
				}}
			/>

			<button
				className="floating-rovo-button"
				type="button"
				onClick={() => openChat("floating")}
				aria-label="Open Rovo"
			>
				<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
			</button>
		</>
	);
}
