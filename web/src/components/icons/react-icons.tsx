/**
 * Various icons using react-icons
 * These icons address the missing icons from PatternFly for network observability
 */
import * as React from 'react';
import { FaBolt, FaNetworkWired } from 'react-icons/fa';
import { MdDataUsage, MdToggleOff, MdToggleOn } from 'react-icons/md';
import { RiArrowLeftRightLine } from 'react-icons/ri';
import { TbDownload, TbFilter, TbFilterOff, TbMapPin, TbUpload } from 'react-icons/tb';
import { IconWrapper } from './react-icons-wrapper';

// Source: upload icon represents data origin/starting point
export const SourceIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={TbUpload} size={size} className={className} />
);

// Destination: download icon represents data target/endpoint
export const DestinationIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={TbDownload} size={size} className={className} />
);

// Bidirectional: arrows exchange represents traffic matched in both directions
export const BackAndForthIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={RiArrowLeftRightLine} size={size} className={className} />
);

// Endpoint: location pin represents a network endpoint
export const EndpointIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={TbMapPin} size={size} className={className} />
);

// Filter Toggle On Icon
export const FilterToggleOnIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={MdToggleOn} size={size} className={className} />
);

// Filter Toggle Off Icon
export const FilterToggleOffIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={MdToggleOff} size={size} className={className} />
);

// Quick Filters Icon
export const QuickFiltersIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={FaBolt} size={size} className={className} />
);

// Packets Icon
export const PacketsIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={FaNetworkWired} size={size} className={className} />
);

// Bytes Icon
export const BytesIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={MdDataUsage} size={size} className={className} />
);

// Add filter: filter icon represents adding a new filter
export const FilterAddIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={TbFilter} size={size} className={className} />
);

// Remove filter: filter icon represents removing a filter
export const FilterRemoveIcon: React.FC<{ size?: string | number; className?: string }> = ({ size, className }) => (
  <IconWrapper icon={TbFilterOff} size={size} className={className} />
);
