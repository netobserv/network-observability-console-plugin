/**
 * Kubernetes resource icons
 *
 * This module provides React components for Kubernetes resource icons
 * using inline SVGs from the official Kubernetes community icons:
 * https://github.com/kubernetes/community/tree/master/icons
 *
 * and react icons:
 * https://react-icons.github.io/react-icons/
 */

import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { GrGateway, GrHost, GrMultiple, GrServerCluster } from 'react-icons/gr';
import { PiNetwork } from 'react-icons/pi';
import { TbWorldPin } from 'react-icons/tb';
import { IconWrapper } from './react-icons-wrapper';

// All Kubernetes icons return SVG <g> elements directly for use in SVG contexts (like topology)
// Implemented as React.ComponentClass to match PatternFly icon pattern

// Icon props interface matching PatternFly SVGIconProps pattern
interface SVGIconProps {
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

// Kubernetes resource icon components using official community icons
// SVG paths from https://github.com/kubernetes/community/tree/master/icons

// Pod icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/pod.svg
class PodIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    // Center the icon: viewBox center is at (9.017667, 8.750189)
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.86495977,-0.82270299)">
          <path
            d="M 6.2617914,7.036086 9.8826317,5.986087 13.503462,7.036086 9.8826317,8.086087 Z"
            fill="currentColor"
          />
          <path d="m 6.2617914,7.43817 0,3.852778 3.3736103,1.868749 0.0167,-4.713193 z" fill="currentColor" />
          <path d="m 13.503462,7.43817 0,3.852778 -3.37361,1.868749 -0.0167,-4.713193 z" fill="currentColor" />
        </g>
      </g>
    );
  }
}

// Service icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/svc.svg
class ServiceIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    // Center the icon: viewBox center is at (9.017667, 8.750189)
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.90023837,-0.50520354)">
          <path d="m 4.4949896,11.260826 2.9083311,0 0,2.041667 -2.9083311,0 z" fill="currentColor" />
          <path d="m 8.4637407,11.260826 2.9083303,0 0,2.041667 -2.9083303,0 z" fill="currentColor" />
          <path d="m 12.432491,11.260826 2.90833,0 0,2.041667 -2.90833,0 z" fill="currentColor" />
          <path d="m 7.6137407,5.2082921 4.6083303,0 0,2.041667 -4.6083303,0 z" fill="currentColor" />
          <path
            d="m 9.9179005,7.2499601 0,2.005449 -3.966671,0 0,2.0028859"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52916664"
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            d="m 9.9179005,7.2499601 0,2.005449 3.9666705,0 0,2.0028859"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52899998"
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            d="m 9.9095538,7.2512251 0,2.005449 0.0167,0 0,2.0028859"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52916664"
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
        </g>
      </g>
    );
  }
}

// Namespace icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/ns.svg
class NamespaceIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    // Center the icon: viewBox center is at (9.017667, 8.750189)
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.99262638,-1.174181)">
          <rect
            y="6.5793304"
            x="6.1734986"
            height="6.6900792"
            width="7.6735892"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.40000001"
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="0.80000001, 0.4"
            strokeDashoffset="3.44000006"
          />
        </g>
      </g>
    );
  }
}

// Deployment icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/deploy.svg
class DeploymentIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    // Center the icon: viewBox center is at (9.017667, 8.750189)
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-1.64648184,-0.54048037)">
          <path
            d={
              'm 10.225062,13.731632 0,0 C 7.7824218,13.847177 5.7050116,11.968386 5.5753417,9.5264634 ' +
              '5.4456516,7.0845405 7.3124018,4.9962905 9.7535318,4.8524795 c 2.4411202,-0.143811 4.5401412,1.71081 ' +
              '4.6980812,4.1510682 l -1.757081,0.1137208 c -0.0954,-1.473818 -1.36311,-2.593935 -2.8374602,-2.50708 ' +
              '-1.47434,0.08686 -2.60178,1.3480761 -2.52346,2.8228991 0.0783,1.4748224 1.333,2.6095384 ' +
              '2.8082502,2.5397534 z'
            }
            fill="currentColor"
            fillRule="evenodd"
          />
          <path
            d="m 11.135574,9.0088015 1.39745,3.4205085 3.2263,-3.4205085 z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </g>
      </g>
    );
  }
}

// DaemonSet icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/ds.svg
class DaemonSetIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.40634803,-0.71687052)">
          <path
            d="m 7.708299,5.2827748 6.524989,0 0,4.5833348 -6.524989,0 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52914584"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58743756, 1.58743756"
            strokeDashoffset="3.66698074"
          />
          <path
            d="m 4.350169,13.606752 7.074559,0"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.61833036"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />
          <path
            d="m 6.169549,6.6940855 6.524989,0 0,4.5833355 -6.524989,0 z"
            fill="#326ce5"
            fillOpacity="1"
            stroke="currentColor"
            strokeWidth="0.52914584"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58743756, 1.58743756"
            strokeDashoffset="3.87863898"
          />
          <path
            d="m 4.630799,8.1053983 6.524999,0 0,4.5833347 -6.524999,0 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52916664"
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
          <path d="m 4.5865192,8.1226661 6.5250018,0 0,4.5833339 -6.5250018,0 z" fill="currentColor" />
        </g>
      </g>
    );
  }
}

// StatefulSet icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/sts.svg
class StatefulSetIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.72384876,-0.0818705)">
          <path
            d="m 8.0530333,5.1290756 6.5250067,0 0,4.583335 -6.5250067,0 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52914584"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58743761, 1.58743761"
            strokeDashoffset="3.66698074"
          />
          <path
            d="m 6.5142849,6.5403876 6.5250071,0 0,4.5833354 -6.5250071,0 z"
            fill="#326ce5"
            fillOpacity="1"
            stroke="currentColor"
            strokeWidth="0.52914584"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58743761, 1.58743761"
            strokeDashoffset="3.87863898"
          />
          <path d="m 4.9755578,7.9516984 6.5249912,0 0,4.5833346 -6.5249912,0 z" fill="currentColor" />
          <path
            d="m 4.9755578,7.9516984 6.5249912,0 0,4.5833346 -6.5249912,0 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5291667"
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
          <path
            d={
              'm 5.5087198,9.2260482 0,0 c 0,-0.4294054 1.2218881,-0.7775054 2.7291615,-0.7775054 ' +
              '1.5072743,0 2.7291787,0.3481 2.7291787,0.7775054 l 0,0 c 0,0.4294054 -1.2219044,0.7775068 ' +
              '-2.7291787,0.7775068 -1.5072734,0 -2.7291615,-0.3481014 -2.7291615,-0.7775068 z'
            }
            fill="currentColor"
          />
          <path
            d={
              'm 10.967067,9.2260482 0,0 c 0,0.4294054 -1.2219064,0.7775068 -2.7291777,0.7775068 ' +
              '-1.5072734,0 -2.7291614,-0.3481014 -2.7291614,-0.7775068 l 0,0 c 0,-0.4294054 1.221888,-0.7775054 ' +
              '2.7291614,-0.7775054 1.5072733,0 2.7291777,0.3481 2.7291777,0.7775054 l 0,2.1033228 ' +
              'c 0,0.429405 -1.2219064,0.777506 -2.7291777,0.777506 -1.5072734,0 -2.7291614,-0.348101 ' +
              '-2.7291614,-0.777506 l 0,-2.1033228'
            }
            fill="none"
            stroke="#326ce5"
            strokeWidth="0.5291667"
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
        </g>
      </g>
    );
  }
}

// Job icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/job.svg
class JobIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.68857003,-0.0818698)">
          <rect y="10.877846" x="5.4527321" height="2.1426713" width="2.2029927" fill="currentColor" />
          <rect width="2.2029927" height="2.1426713" x="8.6047411" y="10.877846" fill="currentColor" />
          <rect y="10.877846" x="11.756749" height="2.1426713" width="2.2029927" fill="currentColor" />
          <rect width="2.2029927" height="2.1426713" x="11.756749" y="7.7276535" fill="currentColor" />
          <rect y="7.7607269" x="8.6148129" height="2.1426713" width="2.2029927" fill="currentColor" />
          <rect width="2.2029927" height="2.1426713" x="5.4728899" y="7.7607269" fill="currentColor" />
          <rect y="4.6436005" x="11.756749" height="2.1426713" width="2.2029927" fill="currentColor" />
        </g>
      </g>
    );
  }
}

// ReplicaSet icon - actual SVG from https://github.com/kubernetes/community/blob/master/icons/svg/resources/unlabeled/rs.svg
class ReplicaSetIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    const scale = (sizeValue / 18.035334) * 2;
    const centerX = 9.017667;
    const centerY = 8.750189;
    return (
      <g
        className={className}
        style={style}
        transform={`translate(${sizeValue / 2 - centerX * scale}, ${sizeValue / 2 - centerY * scale}) scale(${scale})`}
      >
        <g transform="translate(-0.82964531,-0.50523985)">
          <path
            d="m 8.123609,5.5524084 6.52499,0 0,4.5833346 -6.52499,0 z"
            fill="#326ce5"
            fillOpacity="1"
            stroke="currentColor"
            strokeWidth="0.52899998"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58700001, 1.58700001"
            strokeDashoffset="3.66597009"
          />
          <path
            d="m 6.5848588,6.9637194 6.5249902,0 0,4.5833346 -6.5249902,0 z"
            fill="#326ce5"
            fillOpacity="1"
            stroke="currentColor"
            strokeWidth="0.52914584"
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeDasharray="1.58743756, 1.58743756"
            strokeDashoffset="3.87863898"
          />
          <path d="m 5.0461088,8.3750314 6.5250002,0 0,4.5833346 -6.5250002,0 z" fill="currentColor" />
          <path
            d="m 5.0461088,8.3750314 6.5250002,0 0,4.5833346 -6.5250002,0 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.52916664"
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
        </g>
      </g>
    );
  }
}

// Node icon - using GrHost from react-icons
// Kubernetes icon is too complex and not very readable, so we use the GrHost icon from react-icons instead
class NodeIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    return <IconWrapper icon={GrHost} size={sizeValue} className={className} style={style} />;
  }
}

class ClusterIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    return <IconWrapper icon={GrServerCluster} size={sizeValue} className={className} style={style} />;
  }
}

class ZoneIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    return <IconWrapper icon={TbWorldPin} size={sizeValue} className={className} style={style} />;
  }
}

class NetworkIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    return <IconWrapper icon={PiNetwork} size={sizeValue} className={className} style={style} />;
  }
}

class GatewayIcon extends React.Component<SVGIconProps> {
  render() {
    const { size, className, style } = this.props;
    const sizeValue = typeof size === 'number' ? size : parseFloat(size as string) || 18;
    return <IconWrapper icon={GrGateway} size={sizeValue} className={className} style={style} />;
  }
}

/**
 * Get the appropriate icon component for a Kubernetes resource kind
 * Uses official Kubernetes community icons as inline SVGs
 *
 * Returns React.ComponentClass to match PatternFly icon pattern
 * All icons are implemented as class components extending React.Component<SVGIconProps>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getK8sResourceIcon = (resourceKind: string | undefined): React.ComponentClass<any> | null => {
  if (!resourceKind) {
    return null;
  }
  // Normalize the resource kind (case-insensitive matching, handle common variations)
  const normalizedKind = resourceKind.trim().toLowerCase();

  // Use a map for more flexible matching - ensure stable references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kindMap: { [key: string]: React.ComponentClass<any> } = {
    service: ServiceIcon,
    svc: ServiceIcon,
    pod: PodIcon,
    namespace: NamespaceIcon,
    ns: NamespaceIcon,
    node: NodeIcon,
    cluster: ClusterIcon,
    zone: ZoneIcon,
    udn: NetworkIcon,
    gateway: GatewayIcon,
    daemonset: DaemonSetIcon,
    ds: DaemonSetIcon,
    deployment: DeploymentIcon,
    deploy: DeploymentIcon,
    catalogsource: DeploymentIcon, // No specific icon available, using DeploymentIcon
    replicationcontroller: DeploymentIcon, // No specific icon available, using DeploymentIcon
    statefulset: StatefulSetIcon,
    sts: StatefulSetIcon,
    job: JobIcon,
    replicaset: ReplicaSetIcon,
    rs: ReplicaSetIcon,
    rc: DeploymentIcon
  };

  const icon = kindMap[normalizedKind];
  if (icon) {
    return icon;
  }

  // Debug: log unmatched resourceKind to help diagnose binding issues
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[getK8sResourceIcon] Unmatched resourceKind:', resourceKind, 'normalized:', normalizedKind);
  }

  return null;
};

/**
 * Enhanced group icon for topology
 * Uses a better icon than the default CubesIcon
 */
export const TopologyGroupIcon: React.FC<{
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ size, className, style }) => <IconWrapper icon={GrMultiple} size={size} className={className} style={style} />;

/**
 * Kubernetes icon components map
 * Uses official Kubernetes community icons as inline SVGs
 */
export const K8sIconComponents = {
  Service: ServiceIcon,
  Pod: PodIcon,
  Namespace: NamespaceIcon,
  Node: NodeIcon,
  Cluster: ClusterIcon,
  Zone: ZoneIcon,
  UDN: NetworkIcon,
  Gateway: GatewayIcon,
  Deployment: DeploymentIcon,
  CatalogSource: DeploymentIcon, // No specific icon available
  DaemonSet: DaemonSetIcon,
  StatefulSet: StatefulSetIcon,
  Job: JobIcon,
  ReplicaSet: ReplicaSetIcon,
  ReplicationController: ReplicaSetIcon, // No specific icon available
  External: ExternalLinkAltIcon
};
