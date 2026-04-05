"use client";

import { BluetoothIcon, Trash2Icon } from "@/components/ui/vpk-icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AlertDialogDemo() {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
				Delete
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Confirm</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoBasic() {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={<Button variant="outline">Default</Button>}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoCustomActions() {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="outline">Unsaved changes</Button>} />
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Unsaved changes</AlertDialogTitle>
					<AlertDialogDescription>
						You have unsaved changes. Would you like to save them before leaving?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="outline">Save draft</AlertDialogAction>
					<AlertDialogAction>Confirm</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoDefault() {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="outline">Delete item</Button>} />
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the item
						and remove its data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoDestructive() {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={<Button variant="destructive">Delete Chat</Button>}
			/>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
						<Trash2Icon />
					</AlertDialogMedia>
					<AlertDialogTitle>Delete chat?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete this chat conversation. View{" "}
						<a href="#">Settings</a> delete any memories saved during this
						chat.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive">Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoInDialog() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alert Dialog Demo</DialogTitle>
					<DialogDescription>
						Click the button below to open an alert dialog.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<AlertDialog>
						<AlertDialogTrigger render={<Button />}>
							Open Alert Dialog
						</AlertDialogTrigger>
						<AlertDialogContent size="sm">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									your account and remove your data from our servers.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction>Continue</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function AlertDialogDemoSmallWithMedia() {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={<Button variant="outline">Small (Media)</Button>}
			/>

			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogMedia>
						<BluetoothIcon />
					</AlertDialogMedia>
					<AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
					<AlertDialogDescription>
						Do you want to allow the USB accessory to connect to this device?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
					<AlertDialogAction>Allow</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoSmall() {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="outline">Small</Button>} />
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
					<AlertDialogDescription>
						Do you want to allow the USB accessory to connect to this device?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
					<AlertDialogAction>Allow</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function AlertDialogDemoWithMedia() {
	return (
		<AlertDialog>
			<AlertDialogTrigger
				render={<Button variant="outline">Default (Media)</Button>}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<BluetoothIcon />
					</AlertDialogMedia>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete your account and remove your data
						from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
