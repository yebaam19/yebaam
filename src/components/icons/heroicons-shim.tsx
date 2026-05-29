/**
 * Heroicons → Iconify (Lucide) compatibility shim.
 *
 * Re-exports every heroicon name used in the codebase as a thin wrapper
 * around `@iconify/react` pointing at the equivalent Lucide icon. Existing
 * call sites like `<ChevronRightIcon className="h-5 w-5" />` keep working
 * without any JSX changes — we only sed the import path from
 * `@/components/icons/heroicons-shim` (and `/24/solid`) to this module.
 *
 * To switch the entire app to a different Iconify collection later (e.g.
 * `phosphor`, `tabler`, `mdi`), change the `PREFIX` constant below.
 */

import { Icon, type IconProps } from '@iconify/react'
import type { ComponentType, SVGProps } from 'react'

const PREFIX = 'lucide'

type HeroiconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  // heroicons accepts these extra props that Iconify's <Icon> also honors
  title?: string
  titleId?: string
}

function make(name: string): ComponentType<HeroiconProps> {
  const IconComponent = (props: HeroiconProps) => (
    <Icon {...(props as unknown as IconProps)} icon={`${PREFIX}:${name}`} />
  )
  IconComponent.displayName = `Heroicon(${name})`
  return IconComponent
}

// prettier-ignore
const MAP = {
  AcademicCapIcon: 'graduation-cap',
  AdjustmentsHorizontalIcon: 'sliders-horizontal',
  ArrowLeftIcon: 'arrow-left',
  ArrowPathIcon: 'rotate-cw',
  ArrowRightIcon: 'arrow-right',
  ArrowTopRightOnSquareIcon: 'external-link',
  ArrowUpTrayIcon: 'upload',
  ArrowsPointingOutIcon: 'maximize',
  Bars3Icon: 'menu',
  BeakerIcon: 'flask-conical',
  BellIcon: 'bell',
  BellSolidIcon: 'bell',
  BookOpenIcon: 'book-open',
  BookmarkIcon: 'bookmark',
  BriefcaseIcon: 'briefcase',
  BuildingStorefrontIcon: 'store',
  CakeIcon: 'cake',
  CalendarIcon: 'calendar',
  CameraIcon: 'camera',
  ChartBarIcon: 'bar-chart-3',
  ChatBubbleLeftIcon: 'message-circle',
  ChatBubbleLeftRightIcon: 'messages-square',
  ChatBubbleOvalLeftIcon: 'message-circle',
  CheckBadgeIcon: 'badge-check',
  CheckCircleIcon: 'check-circle-2',
  CheckIcon: 'check',
  ChevronDownIcon: 'chevron-down',
  ChevronLeftIcon: 'chevron-left',
  ChevronRightIcon: 'chevron-right',
  ChevronUpIcon: 'chevron-up',
  ClipboardDocumentIcon: 'clipboard',
  ClockIcon: 'clock',
  CloudArrowUpIcon: 'cloud-upload',
  CodeBracketIcon: 'code',
  Cog6ToothIcon: 'settings',
  CurrencyDollarIcon: 'dollar-sign',
  DocumentArrowDownIcon: 'file-down',
  DocumentIcon: 'file',
  DocumentTextIcon: 'file-text',
  EllipsisHorizontalCircleIcon: 'more-horizontal',
  EllipsisHorizontalIcon: 'more-horizontal',
  EllipsisVerticalIcon: 'more-vertical',
  EnvelopeIcon: 'mail',
  ExclamationCircleIcon: 'alert-circle',
  ExclamationTriangleIcon: 'alert-triangle',
  EyeIcon: 'eye',
  EyeSlashIcon: 'eye-off',
  FaceFrownIcon: 'frown',
  FaceSmileIcon: 'smile',
  FireIcon: 'flame',
  FolderIcon: 'folder',
  FolderPlusIcon: 'folder-plus',
  FunnelIcon: 'filter',
  GifIcon: 'image',
  GlobeAltIcon: 'globe',
  GlobeAmericasIcon: 'globe-2',
  HandThumbUpIcon: 'thumbs-up',
  HashtagIcon: 'hash',
  HeartIcon: 'heart',
  HeartSolidIcon: 'heart',
  HomeIcon: 'home',
  InformationCircleIcon: 'info',
  LanguageIcon: 'languages',
  LightBulbIcon: 'lightbulb',
  LinkIcon: 'link',
  ListBulletIcon: 'list',
  LockClosedIcon: 'lock',
  LockOpenIcon: 'lock-open',
  MagnifyingGlassIcon: 'search',
  MagnifyingGlassMinusIcon: 'zoom-out',
  MagnifyingGlassPlusIcon: 'zoom-in',
  MapIcon: 'map',
  MapPinIcon: 'map-pin',
  MicrophoneIcon: 'mic',
  MinusIcon: 'minus',
  MoonIcon: 'moon',
  MusicalNoteIcon: 'music',
  NewspaperIcon: 'newspaper',
  PaperAirplaneIcon: 'send',
  PencilIcon: 'pencil',
  PencilSquareIcon: 'square-pen',
  PhoneIcon: 'phone',
  PhotoIcon: 'image',
  PlayIcon: 'play',
  PlusIcon: 'plus',
  ShareIcon: 'share-2',
  ShieldCheckIcon: 'shield-check',
  SignalIcon: 'signal',
  SignalSlashIcon: 'signal-zero',
  SparklesIcon: 'sparkles',
  Squares2X2Icon: 'grid-2x2',
  StarIcon: 'star',
  StarSolidIcon: 'star',
  SunIcon: 'sun',
  TableCellsIcon: 'table',
  TagIcon: 'tag',
  TrashIcon: 'trash-2',
  TrophyIcon: 'trophy',
  UserCircleIcon: 'user-circle',
  UserGroupIcon: 'users',
  UserIcon: 'user',
  UserMinusIcon: 'user-minus',
  UserPlusIcon: 'user-plus',
  UsersIcon: 'users',
  VideoCameraIcon: 'video',
  WifiIcon: 'wifi',
  XCircleIcon: 'x-circle',
  XMarkIcon: 'x',
  ArrowDownTrayIcon: 'download',
  ArrowPathRoundedSquareIcon: 'rotate-ccw-square',
  ArrowTrendingUpIcon: 'trending-up',
  BoldIcon: 'bold',
  BoltIcon: 'zap',
  BuildingLibraryIcon: 'library',
  BuildingOffice2Icon: 'building-2',
  BuildingOfficeIcon: 'building',
  CalendarDaysIcon: 'calendar-days',
  ChatBubbleBottomCenterTextIcon: 'message-square-text',
  ComputerDesktopIcon: 'monitor',
  DevicePhoneMobileIcon: 'smartphone',
  FilmIcon: 'film',
  FlagIcon: 'flag',
  HandRaisedIcon: 'hand',
  HomeModernIcon: 'home',
  InboxArrowDownIcon: 'inbox',
  ItalicIcon: 'italic',
  LifebuoyIcon: 'life-buoy',
  MegaphoneIcon: 'megaphone',
  PaintBrushIcon: 'paintbrush',
  PauseIcon: 'pause',
  QuestionMarkCircleIcon: 'help-circle',
  QueueListIcon: 'list-ordered',
  RectangleStackIcon: 'layers',
  RocketLaunchIcon: 'rocket',
  ScaleIcon: 'scale',
  ServerIcon: 'server',
  ShoppingBagIcon: 'shopping-bag',
  SpeakerWaveIcon: 'volume-2',
  SpeakerXMarkIcon: 'volume-x',
  StopIcon: 'square',
  TicketIcon: 'ticket',
  TvIcon: 'tv',
  WrenchScrewdriverIcon: 'wrench',
} as const

export const AcademicCapIcon = make(MAP.AcademicCapIcon)
export const AdjustmentsHorizontalIcon = make(MAP.AdjustmentsHorizontalIcon)
export const ArrowLeftIcon = make(MAP.ArrowLeftIcon)
export const ArrowPathIcon = make(MAP.ArrowPathIcon)
export const ArrowRightIcon = make(MAP.ArrowRightIcon)
export const ArrowTopRightOnSquareIcon = make(MAP.ArrowTopRightOnSquareIcon)
export const ArrowUpTrayIcon = make(MAP.ArrowUpTrayIcon)
export const ArrowsPointingOutIcon = make(MAP.ArrowsPointingOutIcon)
export const Bars3Icon = make(MAP.Bars3Icon)
export const BeakerIcon = make(MAP.BeakerIcon)
export const BellIcon = make(MAP.BellIcon)
export const BellSolidIcon = make(MAP.BellSolidIcon)
export const BookOpenIcon = make(MAP.BookOpenIcon)
export const BookmarkIcon = make(MAP.BookmarkIcon)
export const BriefcaseIcon = make(MAP.BriefcaseIcon)
export const BuildingStorefrontIcon = make(MAP.BuildingStorefrontIcon)
export const CakeIcon = make(MAP.CakeIcon)
export const CalendarIcon = make(MAP.CalendarIcon)
export const CameraIcon = make(MAP.CameraIcon)
export const ChartBarIcon = make(MAP.ChartBarIcon)
export const ChatBubbleLeftIcon = make(MAP.ChatBubbleLeftIcon)
export const ChatBubbleLeftRightIcon = make(MAP.ChatBubbleLeftRightIcon)
export const ChatBubbleOvalLeftIcon = make(MAP.ChatBubbleOvalLeftIcon)
export const CheckBadgeIcon = make(MAP.CheckBadgeIcon)
export const CheckCircleIcon = make(MAP.CheckCircleIcon)
export const CheckIcon = make(MAP.CheckIcon)
export const ChevronDownIcon = make(MAP.ChevronDownIcon)
export const ChevronLeftIcon = make(MAP.ChevronLeftIcon)
export const ChevronRightIcon = make(MAP.ChevronRightIcon)
export const ChevronUpIcon = make(MAP.ChevronUpIcon)
export const ClipboardDocumentIcon = make(MAP.ClipboardDocumentIcon)
export const ClockIcon = make(MAP.ClockIcon)
export const CloudArrowUpIcon = make(MAP.CloudArrowUpIcon)
export const CodeBracketIcon = make(MAP.CodeBracketIcon)
export const Cog6ToothIcon = make(MAP.Cog6ToothIcon)
export const CurrencyDollarIcon = make(MAP.CurrencyDollarIcon)
export const DocumentArrowDownIcon = make(MAP.DocumentArrowDownIcon)
export const DocumentIcon = make(MAP.DocumentIcon)
export const DocumentTextIcon = make(MAP.DocumentTextIcon)
export const EllipsisHorizontalCircleIcon = make(MAP.EllipsisHorizontalCircleIcon)
export const EllipsisHorizontalIcon = make(MAP.EllipsisHorizontalIcon)
export const EllipsisVerticalIcon = make(MAP.EllipsisVerticalIcon)
export const EnvelopeIcon = make(MAP.EnvelopeIcon)
export const ExclamationCircleIcon = make(MAP.ExclamationCircleIcon)
export const ExclamationTriangleIcon = make(MAP.ExclamationTriangleIcon)
export const EyeIcon = make(MAP.EyeIcon)
export const EyeSlashIcon = make(MAP.EyeSlashIcon)
export const FaceFrownIcon = make(MAP.FaceFrownIcon)
export const FaceSmileIcon = make(MAP.FaceSmileIcon)
export const FireIcon = make(MAP.FireIcon)
export const FolderIcon = make(MAP.FolderIcon)
export const FolderPlusIcon = make(MAP.FolderPlusIcon)
export const FunnelIcon = make(MAP.FunnelIcon)
export const GifIcon = make(MAP.GifIcon)
export const GlobeAltIcon = make(MAP.GlobeAltIcon)
export const GlobeAmericasIcon = make(MAP.GlobeAmericasIcon)
export const HandThumbUpIcon = make(MAP.HandThumbUpIcon)
export const HashtagIcon = make(MAP.HashtagIcon)
export const HeartIcon = make(MAP.HeartIcon)
export const HeartSolidIcon = make(MAP.HeartSolidIcon)
export const HomeIcon = make(MAP.HomeIcon)
export const InformationCircleIcon = make(MAP.InformationCircleIcon)
export const LanguageIcon = make(MAP.LanguageIcon)
export const LightBulbIcon = make(MAP.LightBulbIcon)
export const LinkIcon = make(MAP.LinkIcon)
export const ListBulletIcon = make(MAP.ListBulletIcon)
export const LockClosedIcon = make(MAP.LockClosedIcon)
export const LockOpenIcon = make(MAP.LockOpenIcon)
export const MagnifyingGlassIcon = make(MAP.MagnifyingGlassIcon)
export const MagnifyingGlassMinusIcon = make(MAP.MagnifyingGlassMinusIcon)
export const MagnifyingGlassPlusIcon = make(MAP.MagnifyingGlassPlusIcon)
export const MapIcon = make(MAP.MapIcon)
export const MapPinIcon = make(MAP.MapPinIcon)
export const MicrophoneIcon = make(MAP.MicrophoneIcon)
export const MinusIcon = make(MAP.MinusIcon)
export const MoonIcon = make(MAP.MoonIcon)
export const MusicalNoteIcon = make(MAP.MusicalNoteIcon)
export const NewspaperIcon = make(MAP.NewspaperIcon)
export const PaperAirplaneIcon = make(MAP.PaperAirplaneIcon)
export const PencilIcon = make(MAP.PencilIcon)
export const PencilSquareIcon = make(MAP.PencilSquareIcon)
export const PhoneIcon = make(MAP.PhoneIcon)
export const PhotoIcon = make(MAP.PhotoIcon)
export const PlayIcon = make(MAP.PlayIcon)
export const PlusIcon = make(MAP.PlusIcon)
export const ShareIcon = make(MAP.ShareIcon)
export const ShieldCheckIcon = make(MAP.ShieldCheckIcon)
export const SignalIcon = make(MAP.SignalIcon)
export const SignalSlashIcon = make(MAP.SignalSlashIcon)
export const SparklesIcon = make(MAP.SparklesIcon)
export const Squares2X2Icon = make(MAP.Squares2X2Icon)
export const StarIcon = make(MAP.StarIcon)
export const StarSolidIcon = make(MAP.StarSolidIcon)
export const SunIcon = make(MAP.SunIcon)
export const TableCellsIcon = make(MAP.TableCellsIcon)
export const TagIcon = make(MAP.TagIcon)
export const TrashIcon = make(MAP.TrashIcon)
export const TrophyIcon = make(MAP.TrophyIcon)
export const UserCircleIcon = make(MAP.UserCircleIcon)
export const UserGroupIcon = make(MAP.UserGroupIcon)
export const UserIcon = make(MAP.UserIcon)
export const UserMinusIcon = make(MAP.UserMinusIcon)
export const UserPlusIcon = make(MAP.UserPlusIcon)
export const UsersIcon = make(MAP.UsersIcon)
export const VideoCameraIcon = make(MAP.VideoCameraIcon)
export const WifiIcon = make(MAP.WifiIcon)
export const XCircleIcon = make(MAP.XCircleIcon)
export const XMarkIcon = make(MAP.XMarkIcon)
export const ArrowDownTrayIcon = make(MAP.ArrowDownTrayIcon)
export const ArrowPathRoundedSquareIcon = make(MAP.ArrowPathRoundedSquareIcon)
export const ArrowTrendingUpIcon = make(MAP.ArrowTrendingUpIcon)
export const BoldIcon = make(MAP.BoldIcon)
export const BoltIcon = make(MAP.BoltIcon)
export const BuildingLibraryIcon = make(MAP.BuildingLibraryIcon)
export const BuildingOffice2Icon = make(MAP.BuildingOffice2Icon)
export const BuildingOfficeIcon = make(MAP.BuildingOfficeIcon)
export const CalendarDaysIcon = make(MAP.CalendarDaysIcon)
export const ChatBubbleBottomCenterTextIcon = make(MAP.ChatBubbleBottomCenterTextIcon)
export const ComputerDesktopIcon = make(MAP.ComputerDesktopIcon)
export const DevicePhoneMobileIcon = make(MAP.DevicePhoneMobileIcon)
export const FilmIcon = make(MAP.FilmIcon)
export const FlagIcon = make(MAP.FlagIcon)
export const HandRaisedIcon = make(MAP.HandRaisedIcon)
export const HomeModernIcon = make(MAP.HomeModernIcon)
export const InboxArrowDownIcon = make(MAP.InboxArrowDownIcon)
export const ItalicIcon = make(MAP.ItalicIcon)
export const LifebuoyIcon = make(MAP.LifebuoyIcon)
export const MegaphoneIcon = make(MAP.MegaphoneIcon)
export const PaintBrushIcon = make(MAP.PaintBrushIcon)
export const PauseIcon = make(MAP.PauseIcon)
export const QuestionMarkCircleIcon = make(MAP.QuestionMarkCircleIcon)
export const QueueListIcon = make(MAP.QueueListIcon)
export const RectangleStackIcon = make(MAP.RectangleStackIcon)
export const RocketLaunchIcon = make(MAP.RocketLaunchIcon)
export const ScaleIcon = make(MAP.ScaleIcon)
export const ServerIcon = make(MAP.ServerIcon)
export const ShoppingBagIcon = make(MAP.ShoppingBagIcon)
export const SpeakerWaveIcon = make(MAP.SpeakerWaveIcon)
export const SpeakerXMarkIcon = make(MAP.SpeakerXMarkIcon)
export const StopIcon = make(MAP.StopIcon)
export const TicketIcon = make(MAP.TicketIcon)
export const TvIcon = make(MAP.TvIcon)
export const WrenchScrewdriverIcon = make(MAP.WrenchScrewdriverIcon)
