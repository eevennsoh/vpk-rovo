"use client";

import Image from "next/image";
import { motion } from "motion/react";
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
              background-color var(--duration-medium) var(--ease-out);
            z-index: 510;
            box-shadow: ${token("elevation.shadow.overlay")};
          }

          .floating-rovo-button img {
            width: 24px;
            height: 24px;
            pointer-events: none;
          }
        `,
				}}
			/>

			<motion.button
				className="floating-rovo-button"
				type="button"
				initial={{ opacity: 0, scale: 0.92, y: 8 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.92, y: 8 }}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.98 }}
				transition={{ duration: 0.18, ease: [0, 0.4, 0, 1] }}
				onClick={() => openChat("floating")}
				aria-label="Open Rovo"
			>
				<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
			</motion.button>
		</>
	);
}
