import React from 'react';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaShare,
  FaWhatsapp,
  FaCheck,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBriefcase,
  FaHome,
  FaCar,
  FaWrench,
  FaBox,
  FaCalendarCheck,
  FaBuilding,
  FaUsers,
  FaTh,
  FaHeading,
  FaAlignLeft,
  FaPhone,
  FaBullhorn,
  FaMap,
  FaComments,
  FaGift,
  FaFileAlt,
  FaChevronRight as FaChevronRightIcon,
  FaChevronLeft as FaChevronLeftIcon,
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaMedal,
  FaClock,
  FaUserCheck,
  FaStar,
  FaStore,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaGlobe,
  FaPhoneAlt,
  FaEnvelope,
  FaShareAlt,
  FaCheckCircle,
  FaChevronDown,
  FaMapMarkedAlt,
  FaFilter,
  FaSortAmountDown,
  FaExpand,
  FaCompress,
  FaCamera,
  FaHeart,
  FaArrowLeft,
  FaRobot,
  FaHandHoldingHeart,
  FaPlus,
  FaImage,
  FaSpinner,
  FaEye,
  FaTags,
  FaExclamationTriangle,
  FaInfoCircle,
  FaQrcode,
  FaRegHeart,
  FaMicrophone
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MdCenterFocusWeak } from 'react-icons/md';

interface IconProps {
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const getSize = (props: IconProps): number => {
  return props.size || props.width || 18;
};

export const IconEye = (props: IconProps) => (
  <FaEye size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconClose = (props: IconProps) => (
  <FaTimes size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconArrowLeft = (props: IconProps) => (
  <FaChevronLeft size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconArrowRight = (props: IconProps) => (
  <FaChevronRight size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconCopy = (props: IconProps) => (
  <FaCopy size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconShare = (props: IconProps) => (
  <FaShare size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconWhatsApp = (props: IconProps) => (
  <FaWhatsapp size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconCheck = (props: IconProps) => (
  <FaCheck size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconSearch = (props: IconProps) => (
  <FaSearch size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconLocation = (props: IconProps) => (
  <FaMapMarkerAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconCalendar = (props: IconProps) => (
  <FaCalendarAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

// Iconos de categorías
export const IconEmpleos = (props: IconProps) => (
  <FaBriefcase size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconInmuebles = (props: IconProps) => (
  <FaHome size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconVehiculos = (props: IconProps) => (
  <FaCar size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconServicios = (props: IconProps) => (
  <FaWrench size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconProductos = (props: IconProps) => (
  <FaGift size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconEventos = (props: IconProps) => (
  <FaCalendarAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconNegocios = (props: IconProps) => (
  <FaStore size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconComunidad = (props: IconProps) => (
  <FaUsers size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconTodos = (props: IconProps) => (
  <FaTh size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconStore = (props: IconProps) => (
  <FaStore size={getSize(props)} color={props.color || 'currentColor'} />
);

// Iconos de Negocio y Social
export const IconInstagram = (props: IconProps) => (
  <FaInstagram size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconFacebook = (props: IconProps) => (
  <FaFacebook size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconTiktok = (props: IconProps) => (
  <FaTiktok size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconGlobe = (props: IconProps) => (
  <FaGlobe size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconPhone = (props: IconProps) => (
  <FaPhoneAlt size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconEnvelope = (props: IconProps) => (
  <FaEnvelope size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconChevronDown = (props: IconProps) => (
  <FaChevronDown size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconShareAlt = (props: IconProps) => (
  <FaShareAlt size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconVerified = (props: IconProps) => (
  <FaCheckCircle size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconWhatsapp = (props: IconProps) => (
  <FaWhatsapp size={getSize(props)} color={props.color || 'currentColor'} />
);
export const IconMapMarkerAlt = (props: IconProps) => (
  <FaMapMarkerAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

// Iconos del formulario
export const IconTitle = (props: IconProps) => (
  <FaHeading size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconDescription = (props: IconProps) => (
  <FaAlignLeft size={getSize(props)} color={props.color || 'currentColor'} />
);



export const IconRobot = (props: IconProps) => (
  <FaRobot size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconMegaphone = (props: IconProps) => (
  <FaBullhorn size={getSize(props)} color={props.color || 'currentColor'} />
);



// Iconos para el sidebar
export const IconMap = (props: IconProps) => (
  <FaMap size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconChatbot = (props: IconProps) => (
  <FaComments size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconGratuitos = (props: IconProps) => (
  <FaGift size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconAdiso = (props: IconProps) => (
  <FaFileAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconMinimize = (props: IconProps) => (
  <FaChevronRightIcon size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconExpand = (props: IconProps) => (
  <FaChevronLeftIcon size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconEdit = (props: IconProps) => (
  <FaEdit size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconTrash = (props: IconProps) => (
  <FaTrash size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconExternalLink = (props: IconProps) => (
  <FaExternalLinkAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconShield = (props: IconProps) => (
  <FaShieldAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconMedal = (props: IconProps) => (
  <FaMedal size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconClock = (props: IconProps) => (
  <FaClock size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconUserCheck = (props: IconProps) => (
  <FaUserCheck size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconStar = (props: IconProps) => (
  <FaStar size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconQrcode = (props: IconProps) => (
  <FaQrcode size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconGoogle = (props: IconProps) => (
  <FcGoogle size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconHeart = (props: IconProps) => (
  <FaHeart size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconHeartOutline = (props: IconProps) => (
  <FaRegHeart size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconMicrophone = (props: IconProps) => (
  <FaMicrophone size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconGoogleLens = (props: IconProps) => (
  <MdCenterFocusWeak size={getSize(props)} color={props.color || 'currentColor'} />
);
