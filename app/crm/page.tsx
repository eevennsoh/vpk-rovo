import AppLayout from "@/components/projects/page";
import CrmView from "@/components/projects/crm/page";

export default function CrmPage() {
	return (
		<AppLayout product="home">
			<CrmView />
		</AppLayout>
	);
}
