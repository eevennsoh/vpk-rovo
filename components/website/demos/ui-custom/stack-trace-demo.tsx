import {
	StackTrace,
	StackTraceHeader,
	StackTraceError,
	StackTraceErrorType,
	StackTraceErrorMessage,
	StackTraceActions,
	StackTraceCopyButton,
	StackTraceExpandButton,
	StackTraceContent,
	StackTraceFrames,
} from "@/components/ui-custom/stack-trace";

const TRACE_BASIC = `TypeError: Cannot read properties of undefined (reading 'map')
    at processData (src/utils/data.ts:42:15)
    at handleRequest (src/api/handler.ts:18:5)
    at async runMiddleware (src/middleware.ts:23:3)`;

const TRACE_WITH_INTERNALS = `ReferenceError: config is not defined
    at loadConfig (src/config/loader.ts:15:10)
    at initializeApp (src/app.ts:8:22)
    at Object.<anonymous> (src/index.ts:3:1)
    at Module._compile (node:internal/modules/cjs/loader:1358:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1416:10)
    at Module.load (node:internal/modules/cjs/loader:1208:32)
    at Module._resolveFilename (node:internal/modules/cjs/loader:1028:15)
    at node:internal/modules/run_main:135:12`;

const TRACE_NETWORK = `Error: fetch failed
    at processResponse (node_modules/undici/lib/web/fetch/index.js:314:12)
    at doFetch (src/lib/api-client.ts:45:18)
    at retryWithBackoff (src/lib/retry.ts:12:5)
    at fetchUserProfile (src/services/user.ts:28:10)
    at renderProfile (src/components/profile.tsx:15:3)`;

export default function StackTraceDemo() {
	return (
		<StackTrace trace={TRACE_BASIC} className="w-full">
			<StackTraceHeader>
				<StackTraceError>
					<StackTraceErrorType />
					<StackTraceErrorMessage />
				</StackTraceError>
				<StackTraceActions>
					<StackTraceCopyButton />
					<StackTraceExpandButton />
				</StackTraceActions>
			</StackTraceHeader>
			<StackTraceContent>
				<StackTraceFrames />
			</StackTraceContent>
		</StackTrace>
	);
}

export function StackTraceDemoOpen() {
	return (
		<StackTrace trace={TRACE_BASIC} defaultOpen className="w-full">
			<StackTraceHeader>
				<StackTraceError>
					<StackTraceErrorType />
					<StackTraceErrorMessage />
				</StackTraceError>
				<StackTraceActions>
					<StackTraceCopyButton />
					<StackTraceExpandButton />
				</StackTraceActions>
			</StackTraceHeader>
			<StackTraceContent>
				<StackTraceFrames />
			</StackTraceContent>
		</StackTrace>
	);
}

export function StackTraceDemoFilterInternals() {
	return (
		<StackTrace trace={TRACE_WITH_INTERNALS} defaultOpen className="w-full">
			<StackTraceHeader>
				<StackTraceError>
					<StackTraceErrorType />
					<StackTraceErrorMessage />
				</StackTraceError>
				<StackTraceActions>
					<StackTraceCopyButton />
					<StackTraceExpandButton />
				</StackTraceActions>
			</StackTraceHeader>
			<StackTraceContent>
				<StackTraceFrames showInternalFrames={false} />
			</StackTraceContent>
		</StackTrace>
	);
}

export function StackTraceDemoClickable() {
	return (
		<StackTrace
			trace={TRACE_NETWORK}
			defaultOpen
			className="w-full"
			onFilePathClick={(path, line, col) =>
				alert(`Open ${path}:${line}:${col}`)
			}
		>
			<StackTraceHeader>
				<StackTraceError>
					<StackTraceErrorType />
					<StackTraceErrorMessage />
				</StackTraceError>
				<StackTraceActions>
					<StackTraceCopyButton />
					<StackTraceExpandButton />
				</StackTraceActions>
			</StackTraceHeader>
			<StackTraceContent>
				<StackTraceFrames />
			</StackTraceContent>
		</StackTrace>
	);
}
