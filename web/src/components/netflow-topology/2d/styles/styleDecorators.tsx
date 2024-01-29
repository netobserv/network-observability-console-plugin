import * as React from 'react';
import { FilterIcon, LevelDownAltIcon, ThumbtackIcon } from '@patternfly/react-icons';
import {
  DEFAULT_DECORATOR_PADDING,
  Node,
  NodeModel,
  TopologyQuadrant,
  ContextMenuItem,
  getDefaultShapeDecoratorCenter
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Decorated, FilterDir, NodeData } from '../../../../model/topology';
import { ClickableDecorator, ContextMenuDecorator } from './styleDecorator';
import { Checkbox } from '@patternfly/react-core';

export const FILTER_EVENT = 'filter';
export const STEP_INTO_EVENT = 'step_into';

const MEDIUM_DECORATOR_PADDING = 5;
const LARGE_DECORATOR_PADDING = 6;

type NodePeer = Node<NodeModel, Decorated<NodeData>>;

type NodeDecoratorsProps = {
  element: NodePeer;
  data: Decorated<NodeData>;
  isPinned: boolean;
  setPinned: (v: boolean) => void;
  isSrcFiltered: boolean;
  setSrcFiltered: (v: boolean) => void;
  isDstFiltered: boolean;
  setDstFiltered: (v: boolean) => void;
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: NodePeer,
    radius?: number
  ) => {
    x: number;
    y: number;
  };
};

export const NodeDecorators: React.FC<NodeDecoratorsProps> = ({
  data,
  element,
  isPinned,
  setPinned,
  isSrcFiltered,
  isDstFiltered,
  setSrcFiltered,
  setDstFiltered,
  getShapeDecoratorCenter
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const eltId = element.getId();
  const controller = element.getController();

  const onPinClick = React.useCallback(() => {
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
  }, [isPinned, setPinned, element, data]);

  const onFilterDirClick = React.useCallback(
    (dir: FilterDir) => () => {
      const currentState = dir === 'src' ? isSrcFiltered : isDstFiltered;
      controller.fireEvent(FILTER_EVENT, eltId, data, dir, currentState);
      dir === 'src' ? setSrcFiltered(!currentState) : setDstFiltered(!currentState);
    },
    [eltId, controller, data, isSrcFiltered, isDstFiltered, setSrcFiltered, setDstFiltered]
  );

  const onFilterClick = React.useCallback(() => {
    controller.fireEvent(FILTER_EVENT, eltId, data, 'src', isSrcFiltered);
    setSrcFiltered(!isSrcFiltered);
  }, [controller, data, eltId, isSrcFiltered, setSrcFiltered]);

  const onStepIntoClick = React.useCallback(() => {
    controller.fireEvent(STEP_INTO_EVENT, { ...data, id: eltId });
  }, [eltId, controller, data]);

  const getPosition = React.useCallback(
    (quadrant: TopologyQuadrant) => {
      return getShapeDecoratorCenter
        ? getShapeDecoratorCenter(quadrant, element)
        : getDefaultShapeDecoratorCenter(quadrant, element);
    },
    [element, getShapeDecoratorCenter]
  );

  const filterMenu: React.ReactElement[] = [
    <ContextMenuItem key={'src'} onClick={onFilterDirClick('src')}>
      <Checkbox
        id={'context-src-checkbox'}
        label={t('Source')}
        isChecked={isSrcFiltered}
        onChange={() => onFilterDirClick('src')}
      />
    </ContextMenuItem>,
    <ContextMenuItem key={'dst'} onClick={onFilterDirClick('dst')}>
      <Checkbox
        id={'context-dst-checkbox'}
        label={t('Destination')}
        isChecked={isDstFiltered}
        onChange={() => onFilterDirClick('dst')}
      />
    </ContextMenuItem>
  ];

  if (!data.showDecorators) {
    return null;
  }

  return (
    <>
      {data.canStepInto && (
        <ClickableDecorator
          pos={getPosition(TopologyQuadrant.lowerRight)}
          icon={<LevelDownAltIcon />}
          tooltip={t('Step into this {{name}}', { name: data.peer.resourceKind?.toLowerCase() })}
          isActive={false}
          onClick={onStepIntoClick}
          padding={MEDIUM_DECORATOR_PADDING}
        />
      )}
      {(data.peer.namespace ||
        data.peer.resource ||
        data.peer.owner ||
        data.peer.addr ||
        data.peer.hostName ||
        data.peer.zone) && (
        <ContextMenuDecorator
          pos={getPosition(TopologyQuadrant.lowerLeft)}
          icon={<FilterIcon />}
          tooltip={t('Filter by source or destination {{name}}', { name: data.peer.resourceKind?.toLowerCase() })}
          isActive={isSrcFiltered || isDstFiltered}
          padding={isSrcFiltered || isDstFiltered ? DEFAULT_DECORATOR_PADDING : LARGE_DECORATOR_PADDING}
          menuItems={filterMenu}
        />
      )}
      {data.peer.clusterName && (
        <ClickableDecorator
          pos={getPosition(TopologyQuadrant.lowerLeft)}
          icon={<FilterIcon />}
          tooltip={t('Filter by {{name}}', { name: data.peer.resourceKind?.toLowerCase() })}
          isActive={isSrcFiltered || isDstFiltered}
          onClick={onFilterClick}
          padding={isSrcFiltered || isDstFiltered ? DEFAULT_DECORATOR_PADDING : LARGE_DECORATOR_PADDING}
        />
      )}
      {
        <ClickableDecorator
          pos={getPosition(TopologyQuadrant.upperRight)}
          icon={<ThumbtackIcon />}
          tooltip={isPinned ? t('Unpin this element') : t('Pin this element')}
          isActive={isPinned}
          onClick={onPinClick}
          padding={MEDIUM_DECORATOR_PADDING}
        />
      }
    </>
  );
};
