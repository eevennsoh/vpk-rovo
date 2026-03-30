"use client";

import { useState } from "react";
import AppLayout from "@/components/projects/page";
import ContactsTable from "./contacts-table";
import ContactDetail from "./contact-detail";
import { CONTACTS, type Contact } from "./data";

import PeopleGroupIcon from "@atlaskit/icon/core/people-group";

export default function ContactsPage() {
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	function handleSelectContact(contact: Contact) {
		setSelectedContact(contact);
		setDetailOpen(true);
	}

	function handleDetailOpenChange(open: boolean) {
		setDetailOpen(open);
		if (!open) {
			setSelectedContact(null);
		}
	}

	return (
		<AppLayout product="home">
			<div className="flex flex-col gap-6 p-8 max-w-[1200px] mx-auto">
				{/* Page Header */}
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center size-10 rounded-sm bg-bg-information-subtler text-icon-information">
						<PeopleGroupIcon label="" />
					</div>
					<div className="flex flex-col gap-0.5">
						<h1 className="text-xl font-semibold text-text">Contacts</h1>
						<p className="text-sm text-text-subtlest">
							Manage your contacts and customer relationships
						</p>
					</div>
				</div>

				{/* Contacts Table */}
				<ContactsTable
					contacts={CONTACTS}
					selectedContactId={selectedContact?.id ?? null}
					onSelectContact={handleSelectContact}
				/>

				{/* Contact Detail Sheet */}
				<ContactDetail
					contact={selectedContact}
					open={detailOpen}
					onOpenChange={handleDetailOpenChange}
				/>
			</div>
		</AppLayout>
	);
}
