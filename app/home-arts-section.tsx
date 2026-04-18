import { ART_COMPONENTS } from "@/app/data/component-manifest";
import { HomeSectionHeading } from "@/app/home-section-heading";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

export function HomeArtsSection() {
	return (
		<>
			<HomeSectionHeading
				id="arts"
				title="Arts"
				count={ART_COMPONENTS.length}
			/>
			<ul className="grid grid-cols-1 list-none m-0 p-0">
				<li className="relative border-r border-b border-border bg-surface p-8">
					<span className="mb-4 block text-sm text-text-subtle">
						Arts coming soon
					</span>
					<div className="flex h-[900px] items-center justify-center bg-bg-neutral p-8">
						<div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface">
							<Empty width="wide">
								<EmptyHeader>
									<EmptyTitle>No art pieces yet</EmptyTitle>
									<EmptyDescription>
										This space is ready for your first art study, concept, or experiment.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</div>
					</div>
				</li>
			</ul>
		</>
	);
}
