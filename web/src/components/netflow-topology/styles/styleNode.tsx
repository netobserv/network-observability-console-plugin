import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Flex, FlexItem, Popover } from '@patternfly/react-core';
import {
  CubeIcon,
  FilterIcon,
  InfoCircleIcon,
  OutlinedHddIcon,
  QuestionCircleIcon,
  ServiceIcon,
  ThumbtackIcon,
  TimesIcon
} from '@patternfly/react-icons';
import {
  Decorator,
  DefaultNode,
  DEFAULT_DECORATOR_RADIUS,
  getDefaultShapeDecoratorCenter,
  Node,
  NodeShape,
  observer,
  Point,
  ScaleDetailsLevel,
  ShapeProps,
  TopologyQuadrant,
  WithDragNodeProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import { TFunction } from 'i18next';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const FILTER_EVENT = 'filter';
export enum DataTypes {
  Default
}
const ICON_PADDING = 20;

type StyleNodeProps = {
  element: Node;
  getCustomShape?: (node: Node) => React.FC<ShapeProps>;
  getShapeDecoratorCenter?: (quadrant: TopologyQuadrant, node: Node, radius?: number) => { x: number; y: number };
  showLabel?: boolean;
  showStatusDecorator?: boolean;
  regrouping?: boolean;
  dragging?: boolean;
} & WithDragNodeProps &
  WithSelectionProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTypeIcon = (dataType?: string): React.ComponentClass<any, any> => {
  switch (dataType?.toLowerCase()) {
    case 'service':
      return ServiceIcon;
    case 'pod':
      return CubeIcon;
    case 'node':
      return OutlinedHddIcon;
    default:
      return QuestionCircleIcon;
  }
};

const getTypeIconColor = (dataType?: string): string => {
  switch (dataType?.toLowerCase()) {
    case 'service':
    case 'pod':
    case 'node':
      return '#393F44';
    default:
      return '#c9190b';
  }
};

const renderIcon = (data: { type?: string }, element: Node): React.ReactNode => {
  const { width, height } = element.getDimensions();
  const shape = element.getNodeShape();
  const iconSize =
    (shape === NodeShape.trapezoid ? width : Math.min(width, height)) -
    (shape === NodeShape.stadium ? 5 : ICON_PADDING) * 2;
  const Component = getTypeIcon(data.type);
  const color = getTypeIconColor(data.type);

  return (
    <g transform={`translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2})`}>
      <Component style={{ color }} width={iconSize} height={iconSize} />
    </g>
  );
};

const renderPopoverDecorator = (
  t: TFunction,
  element: Node,
  quadrant: TopologyQuadrant,
  icon: React.ReactNode,
  data: { name?: string; type?: string; namespace?: string; addr?: string; host?: string },
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number;
    y: number;
  }
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element);

  return (
    <Popover
      hideOnOutsideClick={true}
      hasAutoWidth
      headerContent={
        data.type && data.name && data.namespace ? (
          <ResourceLink inline={true} kind={data.type} name={data.name} namespace={data.namespace} />
        ) : (
          data.addr
        )
      }
      bodyContent={
        <Flex>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem>
              <FlexItem>{t('Kind')}</FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>{t('Namespace')}</FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>{t('Name')}</FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>{t('Address')}</FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>{t('Host')}</FlexItem>
            </FlexItem>
          </Flex>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem className={data.type ? '' : 'text-muted'}>{data.type || t('n/a')}</FlexItem>
            <FlexItem className={data.namespace ? '' : 'text-muted'}>{data.namespace || t('n/a')}</FlexItem>
            <FlexItem className={data.name ? '' : 'text-muted'}>{data.name || t('n/a')}</FlexItem>
            <FlexItem className={data.addr ? '' : 'text-muted'}>{data.addr || t('n/a')}</FlexItem>
            <FlexItem className={data.host ? '' : 'text-muted'}>{data.host || t('n/a')}</FlexItem>
          </Flex>
        </Flex>
      }
    >
      <Decorator x={x} y={y} radius={DEFAULT_DECORATOR_RADIUS} showBackground icon={icon} />
    </Popover>
  );
};

const renderClickableDecorator = (
  t: TFunction,
  element: Node,
  quadrant: TopologyQuadrant,
  icon: React.ReactNode,
  isPinned: boolean,
  onClick: (element: Node) => void,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number;
    y: number;
  }
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element);

  return (
    <Decorator
      x={x}
      y={y}
      radius={DEFAULT_DECORATOR_RADIUS}
      showBackground
      icon={icon}
      className={isPinned ? 'selected-decorator' : ''}
      onClick={() => onClick(element)}
    />
  );
};

const renderDecorators = (
  t: TFunction,
  element: Node,
  data: {
    showDecorators?: boolean;
    name?: string;
    type?: string;
    namespace?: string;
    addr?: string;
    point?: Point;
    isPinned?: boolean;
    setPosition?: (location: Point) => void;
  },
  isPinned: boolean,
  setPinned: (v: boolean) => void,
  isFiltered: boolean,
  setFiltered: (v: boolean) => void,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number;
    y: number;
  }
): React.ReactNode => {
  if (!data.showDecorators) {
    return null;
  }

  const onPinClick = () => {
    const updatedIsPinned = !isPinned;
    data.point = element.getPosition();
    data.isPinned = updatedIsPinned;
    //override setPosition when pinned
    if (updatedIsPinned) {
      data.setPosition = element.setPosition;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      element.setPosition = p => {
        /*nothing to do there*/
      };
    } else {
      element.setPosition = data.setPosition!;
      data.setPosition = undefined;
    }
    element.setData(data);
    setPinned(updatedIsPinned);
  };

  const onFilterClick = () => {
    const updatedIsFiltered = !isFiltered;
    element.getController().fireEvent(FILTER_EVENT, {
      ...data,
      id: element.getId(),
      isFiltered: updatedIsFiltered
    });
    setFiltered(updatedIsFiltered);
  };

  return (
    <>
      {renderClickableDecorator(
        t,
        element,
        TopologyQuadrant.lowerLeft,
        isFiltered ? <TimesIcon /> : <FilterIcon />,
        false,
        onFilterClick,
        getShapeDecoratorCenter
      )}
      {renderClickableDecorator(
        t,
        element,
        TopologyQuadrant.upperRight,
        <ThumbtackIcon />,
        isPinned,
        onPinClick,
        getShapeDecoratorCenter
      )}
      {renderPopoverDecorator(
        t,
        element,
        TopologyQuadrant.lowerRight,
        <InfoCircleIcon />,
        data,
        getShapeDecoratorCenter
      )}
    </>
  );
};

const StyleNode: React.FC<StyleNodeProps> = ({ element, showLabel, dragging, regrouping, ...rest }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const data = element.getData();
  //TODO: check if we can have intelligent pin on view change
  const [isPinned, setPinned] = React.useState<boolean>(false);
  const [isFiltered, setFiltered] = React.useState<boolean>(data.isFiltered === true);
  const detailsLevel = useDetailsLevel();

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach(key => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  const updatedRest = { ...rest };
  if (isPinned) {
    //check if position has changed = controller reset element and is not pinned anymore
    if (element.getPosition() !== data.point) {
      setPinned(false);
    } else {
      updatedRest.dragNodeRef = undefined;
    }
  }

  return (
    <g className={`topology ${data.shadowed ? 'shadowed' : ''}`}>
      <DefaultNode
        element={element}
        {...updatedRest}
        {...passedData}
        dragging={isPinned ? false : dragging}
        regrouping={isPinned ? false : regrouping}
        showLabel={detailsLevel === ScaleDetailsLevel.high && showLabel}
        showStatusBackground={detailsLevel === ScaleDetailsLevel.low}
        showStatusDecorator={detailsLevel === ScaleDetailsLevel.high && passedData.showStatusDecorator}
        attachments={
          detailsLevel === ScaleDetailsLevel.high &&
          renderDecorators(t, element, data, isPinned, setPinned, isFiltered, setFiltered, rest.getShapeDecoratorCenter)
        }
      >
        {renderIcon(passedData, element)}
      </DefaultNode>
    </g>
  );
};

export default observer(StyleNode);
