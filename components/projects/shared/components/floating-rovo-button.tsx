"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { token } from "@/lib/tokens";

type Product = "admin" | "home" | "jira" | "confluence" | "rovo" | "search";

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

          .floating-rovo-button svg {
            width: 24px;
            height: 24px;
          }

          .floating-rovo-button svg path {
            fill: var(--icon-fill, ${token("color.icon.inverse")});
          }

          [data-theme="dark"] .floating-rovo-button {
            --button-bg: ${token("elevation.surface")};
            --icon-fill: ${token("color.icon")};
          }

          @media (prefers-color-scheme: dark) {
            .floating-rovo-button {
              --button-bg: ${token("elevation.surface")};
              --icon-fill: ${token("color.icon")};
            }
          }

          [data-theme="light"] .floating-rovo-button {
            --button-bg: ${token("color.background.neutral.bold")};
            --icon-fill: ${token("color.icon.inverse")};
          }
        `,
				}}
			/>

			<button className="floating-rovo-button" onClick={() => router.push("/rovo-app")} aria-label="Open Rovo">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13.435 0.363775C12.6086 -0.112663 11.5917 -0.121106 10.7586 0.338447C10.7435 0.350143 10.7255 0.362058 10.7085 0.371866C10.1155 0.714353 9.68205 1.26299 9.47825 1.89674C9.39535 2.15859 9.35154 2.43521 9.35154 2.71837V6.31195L12.7403 8.26623L13.8589 8.91009C14.9653 9.54587 15.6437 10.7211 15.6437 11.9956V21.2728C15.6437 21.6482 15.5842 22.0155 15.472 22.3631C15.46 22.4007 15.4474 22.4381 15.4342 22.4753L21.4777 18.9885C22.3216 18.5036 22.8393 17.6076 22.8393 16.6342V7.35705C22.8393 6.38749 22.3184 5.48749 21.477 5.00239L19.9349 4.11389L13.435 0.363775Z"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M2.66975 18.9977L4.10253 19.8244L10.7095 23.6363C11.5358 24.1126 12.5528 24.1211 13.3859 23.6616C13.401 23.6499 13.417 23.6391 13.434 23.6293C14.0277 23.287 14.4618 22.7382 14.6659 22.1042C14.749 21.8421 14.7929 21.5651 14.7929 21.2817V17.6881L11.2958 15.6713L10.2882 15.0902C9.18202 14.4544 8.5032 13.2789 8.5032 12.0045V2.7274C8.5032 2.35249 8.5625 1.9857 8.67438 1.63854C8.68652 1.60041 8.69929 1.56253 8.71269 1.5249L2.66919 5.01169C1.82527 5.49653 1.30762 6.39257 1.30762 7.36597V16.6431C1.30762 17.6127 1.82833 18.5126 2.66975 18.9977Z"
					/>
				</svg>
			</button>
		</>
	);
}
