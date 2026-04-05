import { MoreHorizontalIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TableDemo() {
	return (
		<Table className="w-56">
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Alice</TableCell>
					<TableCell>Admin</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Bob</TableCell>
					<TableCell>User</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoBasic() {
	const invoices = [
		{ invoice: "INV001", paymentStatus: "Paid", totalAmount: "$250.00", paymentMethod: "Credit Card" },
		{ invoice: "INV002", paymentStatus: "Pending", totalAmount: "$150.00", paymentMethod: "PayPal" },
		{ invoice: "INV003", paymentStatus: "Unpaid", totalAmount: "$350.00", paymentMethod: "Bank Transfer" },
		{ invoice: "INV004", paymentStatus: "Paid", totalAmount: "$450.00", paymentMethod: "Credit Card" },
		{ invoice: "INV005", paymentStatus: "Paid", totalAmount: "$550.00", paymentMethod: "PayPal" },
		{ invoice: "INV006", paymentStatus: "Pending", totalAmount: "$200.00", paymentMethod: "Bank Transfer" },
		{ invoice: "INV007", paymentStatus: "Unpaid", totalAmount: "$300.00", paymentMethod: "Credit Card" },
	];

	return (
		<Table>
			<TableCaption>A list of your recent invoices.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[100px]">Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invoices.map((invoice) => (
					<TableRow key={invoice.invoice}>
						<TableCell className="font-medium">{invoice.invoice}</TableCell>
						<TableCell>{invoice.paymentStatus}</TableCell>
						<TableCell>{invoice.paymentMethod}</TableCell>
						<TableCell className="text-right">
							{invoice.totalAmount}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function TableDemoDefault() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>INV-001</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>INV-002</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>INV-003</TableCell>
					<TableCell>Overdue</TableCell>
					<TableCell className="text-right">$350.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoSimple() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead className="text-right">Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Sarah Chen</TableCell>
					<TableCell>sarah.chen@acme.com</TableCell>
					<TableCell className="text-right">Admin</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Marc Rodriguez</TableCell>
					<TableCell>marcus.rodriguez@acme.com</TableCell>
					<TableCell className="text-right">User</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Emily Watson</TableCell>
					<TableCell>emily.watson@acme.com</TableCell>
					<TableCell className="text-right">User</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoWithActions() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Price</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Wireless Mouse</TableCell>
					<TableCell>$29.99</TableCell>
					<TableCell className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="size-8" />
								}
							>
								<MoreHorizontalIcon
								/>
								<span className="sr-only">Open menu</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive">
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Mechanical Keyboard</TableCell>
					<TableCell>$129.99</TableCell>
					<TableCell className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="size-8" />
								}
							>
								<MoreHorizontalIcon
								/>
								<span className="sr-only">Open menu</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive">
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">USB-C Hub</TableCell>
					<TableCell>$49.99</TableCell>
					<TableCell className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="size-8" />
								}
							>
								<MoreHorizontalIcon
								/>
								<span className="sr-only">Open menu</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive">
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoWithBadges() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Task</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Priority</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Design homepage</TableCell>
					<TableCell>
						<span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
							Completed
						</span>
					</TableCell>
					<TableCell className="text-right">
						<span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
							High
						</span>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Implement API</TableCell>
					<TableCell>
						<span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
							In Progress
						</span>
					</TableCell>
					<TableCell className="text-right">
						<span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
							Medium
						</span>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Write tests</TableCell>
					<TableCell>
						<span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
							Pending
						</span>
					</TableCell>
					<TableCell className="text-right">
						<span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
							Low
						</span>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoWithCaption() {
	return (
		<Table>
			<TableCaption>A list of recent invoices</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>INV-001</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>INV-002</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>INV-003</TableCell>
					<TableCell>Overdue</TableCell>
					<TableCell className="text-right">$350.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoWithFooter() {
	const invoices = [
		{ invoice: "INV001", paymentStatus: "Paid", totalAmount: "$250.00", paymentMethod: "Credit Card" },
		{ invoice: "INV002", paymentStatus: "Pending", totalAmount: "$150.00", paymentMethod: "PayPal" },
		{ invoice: "INV003", paymentStatus: "Unpaid", totalAmount: "$350.00", paymentMethod: "Bank Transfer" },
		{ invoice: "INV004", paymentStatus: "Paid", totalAmount: "$450.00", paymentMethod: "Credit Card" },
		{ invoice: "INV005", paymentStatus: "Paid", totalAmount: "$550.00", paymentMethod: "PayPal" },
		{ invoice: "INV006", paymentStatus: "Pending", totalAmount: "$200.00", paymentMethod: "Bank Transfer" },
		{ invoice: "INV007", paymentStatus: "Unpaid", totalAmount: "$300.00", paymentMethod: "Credit Card" },
	];

	return (
		<Table>
			<TableCaption>A list of your recent invoices.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[100px]">Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invoices.map((invoice) => (
					<TableRow key={invoice.invoice}>
						<TableCell className="font-medium">{invoice.invoice}</TableCell>
						<TableCell>{invoice.paymentStatus}</TableCell>
						<TableCell>{invoice.paymentMethod}</TableCell>
						<TableCell className="text-right">
							{invoice.totalAmount}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className="text-right">$2,500.00</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}

export function TableDemoWithInput() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Quantity</TableHead>
					<TableHead>Price</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Wireless Mouse</TableCell>
					<TableCell>
						<Input
							type="number"
							defaultValue="1"
							className="h-8 w-20"
							min="0"
						/>
					</TableCell>
					<TableCell>$29.99</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Mechanical Keyboard</TableCell>
					<TableCell>
						<Input
							type="number"
							defaultValue="2"
							className="h-8 w-20"
							min="0"
						/>
					</TableCell>
					<TableCell>$129.99</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">USB-C Hub</TableCell>
					<TableCell>
						<Input
							type="number"
							defaultValue="1"
							className="h-8 w-20"
							min="0"
						/>
					</TableCell>
					<TableCell>$49.99</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoStriped() {
	const items = [
		{ name: "George Washington", party: "None, Federalist", year: "1789-1797" },
		{ name: "John Adams", party: "Federalist", year: "1797-1801" },
		{ name: "Thomas Jefferson", party: "Democratic-Republican", year: "1801-1809" },
		{ name: "James Madison", party: "Democratic-Republican", year: "1809-1817" },
		{ name: "James Monroe", party: "Democratic-Republican", year: "1817-1825" },
	];

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Party</TableHead>
					<TableHead>Year</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map((item, i) => (
					<TableRow key={item.name} className={i % 2 === 1 ? "bg-surface-sunken" : ""}>
						<TableCell className="font-medium">{item.name}</TableCell>
						<TableCell>{item.party}</TableCell>
						<TableCell>{item.year}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function TableDemoRowHighlight() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Alice Johnson</TableCell>
					<TableCell>Active</TableCell>
					<TableCell className="text-right">$1,200.00</TableCell>
				</TableRow>
				<TableRow data-state="selected">
					<TableCell className="font-medium">Bob Smith</TableCell>
					<TableCell>Active</TableCell>
					<TableCell className="text-right">$850.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Carol Williams</TableCell>
					<TableCell>Inactive</TableCell>
					<TableCell className="text-right">$2,300.00</TableCell>
				</TableRow>
				<TableRow data-state="selected">
					<TableCell className="font-medium">David Brown</TableCell>
					<TableCell>Active</TableCell>
					<TableCell className="text-right">$670.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

export function TableDemoWithSelect() {
	const people = [
		{ label: "Alice Johnson", value: "alice" },
		{ label: "Bob Smith", value: "bob" },
		{ label: "Carol Williams", value: "carol" },
	];

	const tasks = [
		{ task: "Design homepage", assignee: "alice", status: "In Progress" },
		{ task: "Implement API", assignee: "bob", status: "Pending" },
		{ task: "Write tests", assignee: "carol", status: "Completed" },
	];

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Task</TableHead>
					<TableHead>Assignee</TableHead>
					<TableHead>Status</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{tasks.map((item) => (
					<TableRow key={item.task}>
						<TableCell className="font-medium">{item.task}</TableCell>
						<TableCell>
							<Select
								items={people}
								defaultValue={people.find(
									(person) => person.value === item.assignee
								)}
								itemToStringValue={(item) => {
									return item.value;
								}}
							>
								<SelectTrigger className="w-40" size="sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{people.map((person) => (
											<SelectItem key={person.value} value={person}>
												{person.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</TableCell>
						<TableCell>{item.status}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
