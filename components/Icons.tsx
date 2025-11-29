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
  FaChevronLeft as FaChevronLeftIcon
} from 'react-icons/fa';

interface IconProps {
  width?: number;
  height?: number;
  size?: number;
  color?: string;
}

const getSize = (props: IconProps): number => {
  return props.size || props.width || 18;
};

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
  <FaBox size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconEventos = (props: IconProps) => (
  <FaCalendarCheck size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconNegocios = (props: IconProps) => (
  <FaBuilding size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconComunidad = (props: IconProps) => (
  <FaUsers size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconTodos = (props: IconProps) => (
  <FaTh size={getSize(props)} color={props.color || 'currentColor'} />
);

// Iconos del formulario
export const IconTitle = (props: IconProps) => (
  <FaHeading size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconDescription = (props: IconProps) => (
  <FaAlignLeft size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconPhone = (props: IconProps) => (
  <FaPhone size={getSize(props)} color={props.color || 'currentColor'} />
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

export const IconAviso = (props: IconProps) => (
  <FaFileAlt size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconMinimize = (props: IconProps) => (
  <FaChevronRightIcon size={getSize(props)} color={props.color || 'currentColor'} />
);

export const IconExpand = (props: IconProps) => (
  <FaChevronLeftIcon size={getSize(props)} color={props.color || 'currentColor'} />
);
