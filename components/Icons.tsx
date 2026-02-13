import React from 'react';
import {
  FaTimes, FaChevronLeft, FaChevronRight, FaCopy, FaShare, FaWhatsapp, FaCheck, FaSearch,
  FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaHome, FaCar, FaWrench, FaBox, FaCalendarCheck,
  FaBuilding, FaUsers, FaTh, FaHeading, FaAlignLeft, FaPhone, FaBullhorn, FaMap, FaComments,
  FaGift, FaFileAlt, FaEdit, FaTrash, FaExternalLinkAlt, FaShieldAlt, FaMedal, FaClock,
  FaUserCheck, FaStar, FaStore, FaInstagram, FaFacebook, FaTiktok, FaGlobe, FaPhoneAlt,
  FaEnvelope, FaShareAlt, FaCheckCircle, FaChevronDown, FaHeart, FaArrowLeft, FaRobot,
  FaHandHoldingHeart, FaPlus, FaImage, FaSpinner, FaEye, FaTags, FaExclamationTriangle,
  FaInfoCircle, FaQrcode, FaRegHeart, FaMicrophone, FaLinkedin, FaYoutube
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MdCenterFocusWeak } from 'react-icons/md';

/**
 * Icons Registry
 * Centrally managed icon components with consistent sizing and coloring.
 */

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

// UI & Navigation
export const IconClose = (p: IconProps) => <FaTimes size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconArrowLeft = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconArrowRight = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconChevronDown = (p: IconProps) => <FaChevronDown size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconSearch = (p: IconProps) => <FaSearch size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconCheck = (p: IconProps) => <FaCheck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconVerified = (p: IconProps) => <FaCheckCircle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconClock = (p: IconProps) => <FaClock size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconCalendar = (p: IconProps) => <FaCalendarAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMapMarkerAlt = (p: IconProps) => <FaMapMarkerAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconLocation = (p: IconProps) => <FaMapMarkerAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconEye = (p: IconProps) => <FaEye size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;

// Action Icons
export const IconCopy = (p: IconProps) => <FaCopy size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconShare = (p: IconProps) => <FaShare size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconShareAlt = (p: IconProps) => <FaShareAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconEdit = (p: IconProps) => <FaEdit size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconTrash = (p: IconProps) => <FaTrash size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconExternalLink = (p: IconProps) => <FaExternalLinkAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconHeart = (p: IconProps) => <FaHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconHeartOutline = (p: IconProps) => <FaRegHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconStar = (p: IconProps) => <FaStar size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconFileAlt = (p: IconProps) => <FaFileAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconAdiso = (p: IconProps) => <FaFileAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;

// Business & Categories
export const IconStore = (p: IconProps) => <FaStore size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconBox = (p: IconProps) => <FaBox size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconGratuitos = (p: IconProps) => <FaGift size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconTodos = (p: IconProps) => <FaTh size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMegaphone = (p: IconProps) => <FaBullhorn size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconRobot = (p: IconProps) => <FaRobot size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconEmpleos = (p: IconProps) => <FaBriefcase size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconInmuebles = (p: IconProps) => <FaHome size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconVehiculos = (p: IconProps) => <FaCar size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconServicios = (p: IconProps) => <FaWrench size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconProductos = (p: IconProps) => <FaGift size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconEventos = (p: IconProps) => <FaCalendarAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconNegocios = (p: IconProps) => <FaStore size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconComunidad = (p: IconProps) => <FaUsers size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;

// Social & Contact
export const IconWhatsapp = (p: IconProps) => <FaWhatsapp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconWhatsApp = (p: IconProps) => <FaWhatsapp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconInstagram = (p: IconProps) => <FaInstagram size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconFacebook = (p: IconProps) => <FaFacebook size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconTiktok = (p: IconProps) => <FaTiktok size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconLinkedin = (p: IconProps) => <FaLinkedin size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconYoutube = (p: IconProps) => <FaYoutube size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconGlobe = (p: IconProps) => <FaGlobe size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconEnvelope = (p: IconProps) => <FaEnvelope size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconPhone = (p: IconProps) => <FaPhoneAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;

// Specialized UI
export const IconTitle = (p: IconProps) => <FaHeading size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconDescription = (p: IconProps) => <FaAlignLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMap = (p: IconProps) => <FaMap size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconChatbot = (p: IconProps) => <FaComments size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconShield = (p: IconProps) => <FaShieldAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMedal = (p: IconProps) => <FaMedal size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconUserCheck = (p: IconProps) => <FaUserCheck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconQrcode = (p: IconProps) => <FaQrcode size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconGoogle = (p: IconProps) => <FcGoogle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMicrophone = (p: IconProps) => <FaMicrophone size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconGoogleLens = (p: IconProps) => <MdCenterFocusWeak size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconMinimize = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
export const IconExpand = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} />;
