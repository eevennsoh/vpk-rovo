import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { SECTION_CARDS } from "../data/section-cards-data"

export function SectionCards() {
	return (
		<div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
			{SECTION_CARDS.map((card) => {
				const BadgeIcon = card.badgeIcon
				const FooterIcon = card.footerIcon

				return (
					<Card
						key={card.title}
						className="cv-auto @container/card"
						style={{ containIntrinsicSize: "auto 200px" }}
					>
						<CardHeader className="relative">
							<CardDescription>{card.title}</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
								{card.value}
							</CardTitle>
							<div className="absolute right-4 top-4">
								<Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
									<BadgeIcon className="size-3" />
									{card.badge}
								</Badge>
							</div>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">
								{card.footerText} <FooterIcon className="size-4" />
							</div>
							<div className="text-muted-foreground">
								{card.footerDescription}
							</div>
						</CardFooter>
					</Card>
				)
			})}
		</div>
	)
}
