import type {
	CSSProperties,
	ComponentProps,
	ComponentType,
	ReactNode,
} from "react";

import AddIconGlyph from "@atlaskit/icon/core/add";
import ArchiveBoxIconGlyph from "@atlaskit/icon/core/archive-box";
import ArrowDownIconGlyph from "@atlaskit/icon/core/arrow-down";
import ArrowLeftIconGlyph from "@atlaskit/icon/core/arrow-left";
import ArrowRightIconGlyph from "@atlaskit/icon/core/arrow-right";
import ArrowUpIconGlyph from "@atlaskit/icon/core/arrow-up";
import AttachmentIconGlyph from "@atlaskit/icon/core/attachment";
import AiSparkleIconGlyph from "@atlaskit/icon/core/ai-sparkle";
import AlignTextCenterIconGlyph from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIconGlyph from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIconGlyph from "@atlaskit/icon/core/align-text-right";
import BookWithBookmarkIconGlyph from "@atlaskit/icon/core/book-with-bookmark";
import CheckMarkIconGlyph from "@atlaskit/icon/core/check-mark";
import CheckCircleIconGlyph from "@atlaskit/icon/core/check-circle";
import ClipboardIconGlyph from "@atlaskit/icon/core/clipboard";
import ChevronDoubleLeftIconGlyph from "@atlaskit/icon/core/chevron-double-left";
import ChevronDoubleRightIconGlyph from "@atlaskit/icon/core/chevron-double-right";
import ChevronDownIconGlyph from "@atlaskit/icon/core/chevron-down";
import ChevronLeftIconGlyph from "@atlaskit/icon/core/chevron-left";
import ChevronRightIconGlyph from "@atlaskit/icon/core/chevron-right";
import ChevronUpIconGlyph from "@atlaskit/icon/core/chevron-up";
import CommentAddIconGlyph from "@atlaskit/icon/core/comment-add";
import CommentIconGlyph from "@atlaskit/icon/core/comment";
import CommitIconGlyph from "@atlaskit/icon/core/commit";
import CopyIconGlyph from "@atlaskit/icon/core/copy";
import CrossIconGlyph from "@atlaskit/icon/core/cross";
import CrossCircleIconGlyph from "@atlaskit/icon/core/cross-circle";
import DeleteIconGlyph from "@atlaskit/icon/core/delete";
import DownloadIconGlyph from "@atlaskit/icon/core/download";
import DragHandleVerticalIconGlyph from "@atlaskit/icon/core/drag-handle-vertical";
import EditIconGlyph from "@atlaskit/icon/core/edit";
import EyeOpenIconGlyph from "@atlaskit/icon/core/eye-open";
import EyeOpenStrikethroughIconGlyph from "@atlaskit/icon/core/eye-open-strikethrough";
import FileIconGlyph from "@atlaskit/icon/core/file";
import FolderClosedIconGlyph from "@atlaskit/icon/core/folder-closed";
import FolderOpenIconGlyph from "@atlaskit/icon/core/folder-open";
import GlobeIconGlyph from "@atlaskit/icon/core/globe";
import HeartIconGlyph from "@atlaskit/icon/core/heart";
import HomeIconGlyph from "@atlaskit/icon/core/home";
import ImageIconGlyph from "@atlaskit/icon/core/image";
import InformationCircleIconGlyph from "@atlaskit/icon/core/information-circle";
import LinkExternalIconGlyph from "@atlaskit/icon/core/link-external";
import LinkIconGlyph from "@atlaskit/icon/core/link";
import LockLockedIconGlyph from "@atlaskit/icon/core/lock-locked";
import LogOutIconGlyph from "@atlaskit/icon/core/log-out";
import MenuIconGlyph from "@atlaskit/icon/core/menu";
import MicrophoneIconGlyph from "@atlaskit/icon/core/microphone";
import MinusIconGlyph from "@atlaskit/icon/core/minus";
import NotificationIconGlyph from "@atlaskit/icon/core/notification";
import PersonIconGlyph from "@atlaskit/icon/core/person";
import PersonRemoveIconGlyph from "@atlaskit/icon/core/person-remove";
import PeopleGroupIconGlyph from "@atlaskit/icon/core/people-group";
import PanelLeftIconGlyph from "@atlaskit/icon/core/panel-left";
import PhoneIconGlyph from "@atlaskit/icon/core/phone";
import ProjectionScreenIconGlyph from "@atlaskit/icon/core/projection-screen";
import RadioCheckedIconGlyph from "@atlaskit/icon/core/radio-checked";
import RadioUncheckedIconGlyph from "@atlaskit/icon/core/radio-unchecked";
import RefreshIconGlyph from "@atlaskit/icon/core/refresh";
import ScreenIconGlyph from "@atlaskit/icon/core/screen";
import SearchIconGlyph from "@atlaskit/icon/core/search";
import SettingsIconGlyph from "@atlaskit/icon/core/settings";
import ShareIconGlyph from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIconGlyph from "@atlaskit/icon/core/show-more-horizontal";
import ShowMoreVerticalIconGlyph from "@atlaskit/icon/core/show-more-vertical";
import StarStarredIconGlyph from "@atlaskit/icon/core/star-starred";
import AudioIconGlyph from "@atlaskit/icon/core/audio";
import AngleBracketsIconGlyph from "@atlaskit/icon/core/angle-brackets";
import ArrowUpRightIconGlyph from "@atlaskit/icon/core/arrow-up-right";
import CalendarIconGlyph from "@atlaskit/icon/core/calendar";
import CameraIconGlyph from "@atlaskit/icon/core/camera";
import ChartBarIconGlyph from "@atlaskit/icon/core/chart-bar";
import ChartPieIconGlyph from "@atlaskit/icon/core/chart-pie";
import ChartTrendDownIconGlyph from "@atlaskit/icon/core/chart-trend-down";
import ChartTrendUpIconGlyph from "@atlaskit/icon/core/chart-trend-up";
import ClockIconGlyph from "@atlaskit/icon/core/clock";
import DatabaseIconGlyph from "@atlaskit/icon/core/database";
import CreditCardIconGlyph from "@atlaskit/icon/core/credit-card";
import EmailIconGlyph from "@atlaskit/icon/core/email";
import FlagIconGlyph from "@atlaskit/icon/core/flag";
import InboxIconGlyph from "@atlaskit/icon/core/inbox";
import LayoutThreeColumnsIconGlyph from "@atlaskit/icon/core/layout-three-columns";
import LightbulbIconGlyph from "@atlaskit/icon/core/lightbulb";
import ListBulletedIconGlyph from "@atlaskit/icon/core/list-bulleted";
import MaximizeIconGlyph from "@atlaskit/icon/core/maximize";
import MinimizeIconGlyph from "@atlaskit/icon/core/minimize";
import SendIconGlyph from "@atlaskit/icon/core/send";
import TableIconGlyph from "@atlaskit/icon/core/table";
import TargetIconGlyph from "@atlaskit/icon/core/target";
import TaskToDoIconGlyph from "@atlaskit/icon/core/task-to-do";
import TreeIconGlyph from "@atlaskit/icon/core/tree";
import TextBoldIconGlyph from "@atlaskit/icon/core/text-bold";
import TextItalicIconGlyph from "@atlaskit/icon/core/text-italic";
import TextUnderlineIconGlyph from "@atlaskit/icon/core/text-underline";
import ThumbsDownIconGlyph from "@atlaskit/icon/core/thumbs-down";
import ThumbsUpIconGlyph from "@atlaskit/icon/core/thumbs-up";
import VolumeMutedIconGlyph from "@atlaskit/icon/core/volume-muted";
import VideoIconGlyph from "@atlaskit/icon/core/video";
import VideoPauseIconGlyph from "@atlaskit/icon/core/video-pause";
import VideoPlayIconGlyph from "@atlaskit/icon/core/video-play";
import VideoStopIconGlyph from "@atlaskit/icon/core/video-stop";
import WarningIconGlyph from "@atlaskit/icon/core/warning";
import ZoomInIconGlyph from "@atlaskit/icon/core/zoom-in";
import ZoomOutIconGlyph from "@atlaskit/icon/core/zoom-out";
import DiagramSymbolPackageIconGlyph from "@atlaskit/icon-lab/core/diagram-symbol-package";
import AiBotIconGlyph from "@atlaskit/icon-lab/core/ai-bot";
import ArrowCurvedDownLeftIconGlyph from "@atlaskit/icon-lab/core/arrow-curved-down-left";
import BluetoothIconGlyph from "@atlaskit/icon-lab/core/bluetooth";
import HistoryIconGlyph from "@atlaskit/icon-lab/core/history";
import MicrophoneStrikethroughIconGlyph from "@atlaskit/icon-lab/core/microphone-strikethrough";
import PaintBrushIconGlyph from "@atlaskit/icon-lab/core/paint-brush";
import PlusCircleIconGlyph from "@atlaskit/icon-lab/core/plus-circle";
import SaveIconGlyph from "@atlaskit/icon-lab/core/save";
import TerminalIconGlyph from "@atlaskit/icon-lab/core/terminal";
import AudioWaveformIconGlyph from "@atlaskit/icon-lab/core/audio-waveform";
import ArrowStartIconGlyph from "@atlaskit/icon-lab/core/arrow-start";
import QrCodeIconGlyph from "@atlaskit/icon-lab/core/qr-code";
import VideoClosedCaptionsFilledIconGlyph from "@atlaskit/icon-lab/core/video-closed-captions-filled";
import ViewTypeCardHomeIconGlyph from "@atlaskit/icon-lab/core/view-type-card-home";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type AtlaskitIconSize = "small" | "medium";
type AtlaskitRenderIcon = ComponentType<{
	color?: string;
	label: string;
	size?: AtlaskitIconSize;
	spacing?: "none" | "default";
}>;

export interface VpkIconProps
	extends Omit<ComponentProps<"span">, "children"> {
	color?: string;
	children?: ReactNode;
	label?: string;
	size?: AtlaskitIconSize | number;
}

export type VpkIconRenderer = (props: VpkIconProps) => React.JSX.Element;
export type VpkIconComponent = ComponentType<{
  children?: ReactNode;
  className?: string;
  color?: string;
  size?: number | AtlaskitIconSize;
  style?: CSSProperties;
}>;

function mapNumericSizeToAtlaskit(size: number): AtlaskitIconSize {
	if (size <= 14) {
		return "small";
	}
	return "medium";
}

function extractTailwindSize(className: string | undefined): number | null {
	if (!className) {
		return null;
	}

	const match = className.match(/\b(?:size|h|w)-(\d+(?:\.\d+)?)\b/);
	if (!match?.[1]) {
		return null;
	}

	const parsed = Number.parseFloat(match[1]);
	return Number.isFinite(parsed) ? parsed * 4 : null;
}

function resolveAtlaskitSize(
	size: VpkIconProps["size"],
	className: string | undefined,
): AtlaskitIconSize {
	if (typeof size === "string") {
		return size;
	}

	if (typeof size === "number") {
		return mapNumericSizeToAtlaskit(size);
	}

	const classNameSize = extractTailwindSize(className);
	if (classNameSize !== null) {
		return mapNumericSizeToAtlaskit(classNameSize);
	}

	return "medium";
}

function createVpkIcon(
	RenderIcon: AtlaskitRenderIcon,
): VpkIconRenderer {
	return function VpkIcon({
		className,
		color,
		label,
		size,
		...props
	}: Readonly<VpkIconProps>) {
		return (
			<Icon
				className={cn("shrink-0", className)}
				label={label}
				style={color ? { color } : undefined}
				render={
					<RenderIcon
						label={label ?? ""}
						size={resolveAtlaskitSize(size, className)}
						spacing="none"
					/>
				}
				{...props}
			/>
		);
	};
}

function createUnsafeVpkIcon(RenderIcon: unknown): VpkIconComponent {
	return createVpkIcon(RenderIcon as AtlaskitRenderIcon);
}

export const MessageCircleIcon = createUnsafeVpkIcon(CommentIconGlyph);
export const CheckIcon = createUnsafeVpkIcon(CheckMarkIconGlyph);
export const Check = CheckIcon;
export const CopyIcon = createUnsafeVpkIcon(CopyIconGlyph);
export const EyeIcon = createUnsafeVpkIcon(EyeOpenIconGlyph);
export const EyeOffIcon = createUnsafeVpkIcon(EyeOpenStrikethroughIconGlyph);
export const ChevronLeftIcon = createUnsafeVpkIcon(ChevronLeftIconGlyph);
export const ChevronRightIcon = createUnsafeVpkIcon(ChevronRightIconGlyph);
export const ChevronLeft = ChevronLeftIcon;
export const ChevronRight = ChevronRightIcon;
export const ChevronDownIcon = createUnsafeVpkIcon(ChevronDownIconGlyph);
export const ChevronDown = ChevronDownIcon;
export const ChevronsLeftIcon = createUnsafeVpkIcon(ChevronDoubleLeftIconGlyph);
export const ChevronsRightIcon = createUnsafeVpkIcon(ChevronDoubleRightIconGlyph);
export const DownloadIcon = createUnsafeVpkIcon(DownloadIconGlyph);
export const ExternalLinkIcon = createUnsafeVpkIcon(LinkExternalIconGlyph);
export const ExternalLink = ExternalLinkIcon;
export const ArchiveX = createUnsafeVpkIcon(ArchiveBoxIconGlyph);
export const ArchiveIcon = ArchiveX;
export const ArrowDownIcon = createUnsafeVpkIcon(ArrowDownIconGlyph);
export const ArrowLeftIcon = createUnsafeVpkIcon(ArrowLeftIconGlyph);
export const ArrowRightIcon = createUnsafeVpkIcon(ArrowRightIconGlyph);
export const ArrowUpIcon = createUnsafeVpkIcon(ArrowUpIconGlyph);
export const ArrowLeft = ArrowLeftIcon;
export const ArrowRight = ArrowRightIcon;
export const ArrowDown = ArrowDownIcon;
export const ArrowUp = ArrowUpIcon;
export const ArrowUpRightIcon = createUnsafeVpkIcon(ArrowUpRightIconGlyph);
export const ArrowUpRight = ArrowUpRightIcon;
export const ArrowLeftCircleIcon = ArrowLeftIcon;
export const PaperclipIcon = createUnsafeVpkIcon(AttachmentIconGlyph);
export const SearchIcon = createUnsafeVpkIcon(SearchIconGlyph);
export const Search = SearchIcon;
export const BookmarkIcon = createUnsafeVpkIcon(BookWithBookmarkIconGlyph);
export const BookIcon = createUnsafeVpkIcon(BookWithBookmarkIconGlyph);
export const BoldIcon = createUnsafeVpkIcon(TextBoldIconGlyph);
export const ItalicIcon = createUnsafeVpkIcon(TextItalicIconGlyph);
export const UnderlineIcon = createUnsafeVpkIcon(TextUnderlineIconGlyph);
export const PackageIcon = createUnsafeVpkIcon(DiagramSymbolPackageIconGlyph);
export const TerminalIcon = createUnsafeVpkIcon(TerminalIconGlyph);
export const CircleAlertIcon = createUnsafeVpkIcon(InformationCircleIconGlyph);
export const TriangleAlertIcon = createUnsafeVpkIcon(WarningIconGlyph);
export const Copy = CopyIcon;
export const SparklesIcon = createUnsafeVpkIcon(AiSparkleIconGlyph);
export const MicIcon = createUnsafeVpkIcon(MicrophoneIconGlyph);
export const MicOffIcon = createUnsafeVpkIcon(MicrophoneStrikethroughIconGlyph);
export const PauseIcon = createUnsafeVpkIcon(VideoPauseIconGlyph);
export const Pause = PauseIcon;
export const PlayIcon = createUnsafeVpkIcon(VideoPlayIconGlyph);
export const Play = PlayIcon;
export const Settings = createUnsafeVpkIcon(SettingsIconGlyph);
export const SettingsIcon = Settings;
export const SquareIcon = createUnsafeVpkIcon(VideoStopIconGlyph);
export const Square = SquareIcon;
export const XIcon = createUnsafeVpkIcon(CrossIconGlyph);
export const MinusIcon = createUnsafeVpkIcon(MinusIconGlyph);
export const Minus = MinusIcon;
export const PlusIcon = createUnsafeVpkIcon(AddIconGlyph);
export const Plus = PlusIcon;
export const Trash2Icon = createUnsafeVpkIcon(DeleteIconGlyph);
export const TrashIcon = Trash2Icon;
export const Trash2 = Trash2Icon;
export const DeleteIcon = Trash2Icon;
export const Trash = TrashIcon;
export const MessageSquarePlusIcon = createUnsafeVpkIcon(CommentAddIconGlyph);
export const PencilLineIcon = createUnsafeVpkIcon(EditIconGlyph);
export const PencilIcon = PencilLineIcon;
export const SaveIcon = createUnsafeVpkIcon(SaveIconGlyph);
export const LoaderCircleIcon = createUnsafeVpkIcon(RefreshIconGlyph);
export const LoaderIcon = LoaderCircleIcon;
export const RefreshCwIcon = LoaderCircleIcon;
export const Loader2Icon = LoaderCircleIcon;
export const CornerDownLeftIcon = createUnsafeVpkIcon(ArrowCurvedDownLeftIconGlyph);
export const AlertTriangleIcon = createUnsafeVpkIcon(WarningIconGlyph);
export const AudioWaveformIcon = createUnsafeVpkIcon(AudioWaveformIconGlyph);
export const AudioLinesIcon = AudioWaveformIcon;
export const BarChart3Icon = createUnsafeVpkIcon(ChartBarIconGlyph);
export const BarChartIcon = BarChart3Icon;
export const CalendarIcon = createUnsafeVpkIcon(CalendarIconGlyph);
export const BellIcon = createUnsafeVpkIcon(NotificationIconGlyph);
export const BluetoothIcon = createUnsafeVpkIcon(BluetoothIconGlyph);
export const CreditCardIcon = createUnsafeVpkIcon(CreditCardIconGlyph);
export const CameraIcon = createUnsafeVpkIcon(CameraIconGlyph);
export const DatabaseIcon = createUnsafeVpkIcon(DatabaseIconGlyph);
export const DollarSignIcon = CreditCardIcon;
export const EmailIcon = createUnsafeVpkIcon(EmailIconGlyph);
export const MailIcon = EmailIcon;
export const InboxIcon = createUnsafeVpkIcon(InboxIconGlyph);
export const FileIcon = createUnsafeVpkIcon(FileIconGlyph);
export const FileTextIcon = FileIcon;
export const FileChartColumnIcon = BarChart3Icon;
export const FileCodeIcon = createUnsafeVpkIcon(AngleBracketsIconGlyph);
export const FileJsonIcon = FileIcon;
export const FolderIcon = createUnsafeVpkIcon(FolderClosedIconGlyph);
export const FolderOpenIcon = createUnsafeVpkIcon(FolderOpenIconGlyph);
export const FolderPlusIcon = FolderOpenIcon;
export const GripVerticalIcon = createUnsafeVpkIcon(DragHandleVerticalIconGlyph);
export const GitCommitIcon = createUnsafeVpkIcon(CommitIconGlyph);
export const GitCommitVertical = GitCommitIcon;
export const GlobeIcon = createUnsafeVpkIcon(GlobeIconGlyph);
export const Globe = GlobeIcon;
export const HomeIcon = createUnsafeVpkIcon(HomeIconGlyph);
export const Home = HomeIcon;
export const LayoutDashboardIcon = HomeIcon;
export const ArrowUpCircleIcon = ArrowUpIcon;
export const ImageIcon = createUnsafeVpkIcon(ImageIconGlyph);
export const MonitorIcon = createUnsafeVpkIcon(ScreenIconGlyph);
export const AppWindowIcon = MonitorIcon;
export const KeyboardIcon = createUnsafeVpkIcon(ProjectionScreenIconGlyph);
export const Music2Icon = createUnsafeVpkIcon(AudioIconGlyph);
export const AudioWaveform = AudioWaveformIcon;
export const BotIcon = createUnsafeVpkIcon(AiBotIconGlyph);
export const Bot = BotIcon;
export const CodeIcon = createUnsafeVpkIcon(AngleBracketsIconGlyph);
export const Columns3Icon = createUnsafeVpkIcon(LayoutThreeColumnsIconGlyph);
export const ClockIcon = createUnsafeVpkIcon(ClockIconGlyph);
export const Clock2Icon = ClockIcon;
export const PersonIcon = createUnsafeVpkIcon(PersonIconGlyph);
export const CircleUserRoundIcon = PersonIcon;
export const PhoneIcon = createUnsafeVpkIcon(PhoneIconGlyph);
export const VideoIcon = createUnsafeVpkIcon(VideoIconGlyph);
export const Video = VideoIcon;
export const CaptionsIcon = createUnsafeVpkIcon(VideoClosedCaptionsFilledIconGlyph);
export const TrendingDownIcon = createUnsafeVpkIcon(ChartTrendDownIconGlyph);
export const TrendingUpIcon = createUnsafeVpkIcon(ChartTrendUpIconGlyph);
export const ChartBarIcon = BarChart3Icon;
export const ChartLineIcon = TrendingUpIcon;
export const ChartPieIcon = createUnsafeVpkIcon(ChartPieIconGlyph);
export const ThumbsDownIcon = createUnsafeVpkIcon(ThumbsDownIconGlyph);
export const ThumbsUpIcon = createUnsafeVpkIcon(ThumbsUpIconGlyph);
export const TargetIcon = createUnsafeVpkIcon(TargetIconGlyph);
export const CheckCircle2Icon = createUnsafeVpkIcon(CheckCircleIconGlyph);
export const CheckCircleIcon = CheckCircle2Icon;
export const CircleCheckIcon = CheckCircle2Icon;
export const CircleDotIcon = createUnsafeVpkIcon(RadioCheckedIconGlyph);
export const CircleIcon = createUnsafeVpkIcon(RadioUncheckedIconGlyph);
export const CircleDashedIcon = CircleIcon;
export const UserCircleIcon = PersonIcon;
export const CirclePlusIcon = createUnsafeVpkIcon(PlusCircleIconGlyph);
export const XCircleIcon = createUnsafeVpkIcon(CrossCircleIconGlyph);
export const MessageSquareIcon = MessageCircleIcon;
export const MessageSquareDiffIcon = createUnsafeVpkIcon(CommentAddIconGlyph);
export const MessageCircle = MessageCircleIcon;
export const ListTodoIcon = createUnsafeVpkIcon(TaskToDoIconGlyph);
export const ListIcon = createUnsafeVpkIcon(ListBulletedIconGlyph);
export const ClipboardListIcon = createUnsafeVpkIcon(ClipboardIconGlyph);
export const UsersIcon = createUnsafeVpkIcon(PeopleGroupIconGlyph);
export const FootprintsIcon = ListTodoIcon;
export const WavesIcon = AudioWaveformIcon;
export const MenuIcon = createUnsafeVpkIcon(MenuIconGlyph);
export const LinkIcon = createUnsafeVpkIcon(LinkIconGlyph);
export const LightbulbIcon = createUnsafeVpkIcon(LightbulbIconGlyph);
export const LockIcon = createUnsafeVpkIcon(LockLockedIconGlyph);
export const PaintbrushIcon = createUnsafeVpkIcon(PaintBrushIconGlyph);
export const PlusCircleIcon = createUnsafeVpkIcon(PlusCircleIconGlyph);
export const GalleryVerticalEndIcon = createUnsafeVpkIcon(ViewTypeCardHomeIconGlyph);
export const ShareIcon = createUnsafeVpkIcon(ShareIconGlyph);
export const Share = ShareIcon;
export const SendIcon = createUnsafeVpkIcon(SendIconGlyph);
export const SidebarIcon = createUnsafeVpkIcon(PanelLeftIconGlyph);
export const BookOpenIcon = BookIcon;
export const EllipsisVerticalIcon = createUnsafeVpkIcon(ShowMoreHorizontalIconGlyph);
export const MoreHorizontalIcon = EllipsisVerticalIcon;
export const MoreVerticalIcon = createUnsafeVpkIcon(ShowMoreVerticalIconGlyph);
export const CommandIcon = TerminalIcon;
export const Command = TerminalIcon;
export const MousePointerIcon = createUnsafeVpkIcon(QrCodeIconGlyph);
export const MousePointerClickIcon = MousePointerIcon;
export const PenToolIcon = PaintbrushIcon;
export const ShoppingBagIcon = CreditCardIcon;
export const WandIcon = createUnsafeVpkIcon(ArrowStartIconGlyph);
export const HelpCircleIcon = createUnsafeVpkIcon(InformationCircleIconGlyph);
export const LifeBuoy = HelpCircleIcon;
export const CircleHelpIcon = HelpCircleIcon;
export const InfoIcon = createUnsafeVpkIcon(InformationCircleIconGlyph);
export const RadioIcon = CircleDotIcon;
export const RotateCw = LoaderCircleIcon;
export const RotateCwIcon = LoaderCircleIcon;
export const Disc3 = AudioWaveformIcon;
export const FlipHorizontalIcon = ArrowRightIcon;
export const FlipVerticalIcon = ArrowDownIcon;
export const CalculatorIcon = CreditCardIcon;
export const ClipboardPasteIcon = createUnsafeVpkIcon(ClipboardIconGlyph);
export const LayoutGridIcon = Columns3Icon;
export const ScissorsIcon = DeleteIcon;
export const CornerUpLeft = CornerDownLeftIcon;
export const CornerUpRight = ArrowRightIcon;
export const AlignCenterIcon = createUnsafeVpkIcon(AlignTextCenterIconGlyph);
export const AlignLeftIcon = createUnsafeVpkIcon(AlignTextLeftIconGlyph);
export const AlignRightIcon = createUnsafeVpkIcon(AlignTextRightIconGlyph);
export const LogOutIcon = createUnsafeVpkIcon(LogOutIconGlyph);
export const HeartIcon = createUnsafeVpkIcon(HeartIconGlyph);
export const StarIcon = createUnsafeVpkIcon(StarStarredIconGlyph);
export const Star = StarIcon;
export const StarOff = StarIcon;
export const TableIcon = createUnsafeVpkIcon(TableIconGlyph);
export const UserIcon = PersonIcon;
export const UserRoundXIcon = createUnsafeVpkIcon(PersonRemoveIconGlyph);
export const VolumeXIcon = createUnsafeVpkIcon(VolumeMutedIconGlyph);
export const ZoomInIcon = createUnsafeVpkIcon(ZoomInIconGlyph);
export const ZoomOutIcon = createUnsafeVpkIcon(ZoomOutIconGlyph);
export const MaximizeIcon = createUnsafeVpkIcon(MaximizeIconGlyph);
export const Maximize2 = MaximizeIcon;
export const MinimizeIcon = createUnsafeVpkIcon(MinimizeIconGlyph);
export const HistoryIcon = createUnsafeVpkIcon(HistoryIconGlyph);
export const FlagIcon = createUnsafeVpkIcon(FlagIconGlyph);
export const SheetIcon = FileIcon;
export const ShieldAlertIcon = createUnsafeVpkIcon(WarningIconGlyph);
export const SmileIcon = PersonIcon;
export const Settings2Icon = SettingsIcon;
export const TreePineIcon = createUnsafeVpkIcon(TreeIconGlyph);

export const ChevronsUpDownIcon: VpkIconRenderer = ({
	className,
	color,
	label,
	size,
	...props
}: Readonly<VpkIconProps>) => {
	const resolvedSize = resolveAtlaskitSize(size, className);
	return (
		<Icon
			className={cn("shrink-0", className)}
			label={label}
			style={color ? { color } : undefined}
			render={
				<span className="flex flex-col items-center leading-none">
					<ChevronUpIconGlyph
						label=""
						size={resolvedSize}
						spacing="none"
					/>
					<ChevronDownIconGlyph
						label=""
						size={resolvedSize}
						spacing="none"
					/>
				</span>
			}
			{...props}
		/>
	);
};

export const ChevronsUpDown = ChevronsUpDownIcon;
