"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { token } from "@/lib/tokens";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

interface FloatingRovoButtonProps {
	product: Product;
	embedded?: boolean;
}

export default function FloatingRovoButton({
	product,
	embedded = false,
}: Readonly<FloatingRovoButtonProps>) {
	const router = useRouter();

	if (embedded || product === "rovo") {
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
            border-radius: ${token("radius.xlarge")};
            background-color: var(--button-bg, ${token("color.background.neutral.bold")});
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

          [data-theme="dark"] .floating-rovo-button {
            --button-bg: ${token("elevation.surface")};
          }

          @media (prefers-color-scheme: dark) {
            .floating-rovo-button {
              --button-bg: ${token("elevation.surface")};
            }
          }

          [data-theme="light"] .floating-rovo-button {
            --button-bg: ${token("color.background.neutral.bold")};
          }
        `,
				}}
			/>

			<button className="floating-rovo-button" type="button" onClick={() => router.push("/rovo")} aria-label="Open Rovo">
				<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
			</button>
		</>
	);
}
