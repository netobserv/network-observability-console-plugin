import { Button, Content, ContentVariants, Flex, FlexItem, Popover, PopoverPosition } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ContextSingleton } from '../../utils/context';
import { useHighLight } from '../../utils/highlight-hook';
import './guided-tour.css';

export type GuidedTourItem = {
  title: string;
  description: string;
  assetName?: string;
  minWidth?: string;
  position?: PopoverPosition;
  ref: React.RefObject<HTMLDivElement>;
};

export type IndexChangeFunction = (index: number | undefined) => void;

export type GuidedTourHandle = {
  startTour: () => void;
  updateTourItems: (items: GuidedTourItem[]) => void;
  addOnIndexChangeListener: (fn: IndexChangeFunction) => void;
  clearOnIndexChangeListener: () => void;
};

export interface GuidedTourPopoverProps {
  id: string;
  ref?: React.Ref<GuidedTourHandle>;
  isDark: boolean;
}

const onIndexChangeFunctions: IndexChangeFunction[] = [];
// eslint-disable-next-line react/display-name
export const GuidedTourPopover: React.FC<GuidedTourPopoverProps> = React.forwardRef(
  (props, ref: React.Ref<GuidedTourHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');
    const isStandalone = ContextSingleton.isStandalone();
    const { highlightElement, clearHighlights } = useHighLight(props.isDark);
    const [items, setItems] = React.useState<GuidedTourItem[]>([]);
    const [index, setIndex] = React.useState<number | undefined>();

    React.useImperativeHandle(ref, () => ({
      startTour,
      updateTourItems,
      addOnIndexChangeListener,
      clearOnIndexChangeListener
    }));

    const startTour = () => {
      setIndex(0);
      if (!items.length) {
        console.error('startTour called while items = ', items);
      }
    };

    const updateTourItems = (items: GuidedTourItem[]) => {
      setItems(items);

      if (!items.length) {
        console.error('updateTourItems called while items = ', items);
      }
    };

    const addOnIndexChangeListener = (fn: IndexChangeFunction) => {
      onIndexChangeFunctions.push(fn);
    };

    const clearOnIndexChangeListener = () => {
      onIndexChangeFunctions.splice(0);
    };

    const clearIndex = React.useCallback(() => {
      setIndex(undefined);
      clearHighlights();
    }, [clearHighlights]);

    const previous = React.useCallback(() => {
      if (index) {
        setIndex(index - 1);
      } else {
        clearIndex();
      }
    }, [clearIndex, index]);

    const hasNext = React.useCallback(() => {
      return index != undefined && index < items.length - 1;
    }, [index, items.length]);

    const next = React.useCallback(() => {
      if (hasNext()) {
        setIndex(index! + 1);
      } else {
        clearIndex();
      }
    }, [clearIndex, hasNext, index]);

    const handleHighlights = React.useCallback(() => {
      if (index != undefined && items.length > index && items[index].ref.current) {
        highlightElement(items[index].ref.current!);
      } else {
        clearHighlights();
      }
    }, [clearHighlights, highlightElement, index, items]);

    React.useEffect(() => {
      onIndexChangeFunctions.forEach(fn => {
        fn(index);
      });

      handleHighlights();
    }, [highlightElement, index, items, clearHighlights, handleHighlights]);

    React.useEffect(() => {
      window.addEventListener('resize', handleHighlights);
      return () => {
        window.removeEventListener('resize', handleHighlights);
      };
    }, [handleHighlights]);

    let currentItem = undefined;
    if (index !== undefined) {
      currentItem = items[index];
    }
    return currentItem ? (
      <Popover
        id={`${props.id}-tour-popover`}
        isVisible={index !== undefined}
        position={currentItem!.position ? currentItem.position : undefined}
        hideOnOutsideClick={false}
        showClose={false}
        minWidth={currentItem!.minWidth ? currentItem!.minWidth : undefined}
        headerContent={
          <Flex direction={{ default: 'row' }}>
            <FlexItem flex={{ default: 'flex_1' }}>{currentItem!.title}</FlexItem>
            <FlexItem>
              <Button
                icon={<TimesIcon />}
                variant="plain"
                className="guided-tour-close-button"
                onClick={() => clearIndex()}
              />
            </FlexItem>
          </Flex>
        }
        bodyContent={
          <Flex direction={{ default: 'column' }}>
            <FlexItem flex={{ default: 'flex_1' }}>{currentItem!.description}</FlexItem>
            <FlexItem>
              {currentItem!.assetName && (
                <img
                  src={`${isStandalone ? '/assets/' : '/api/plugins/netobserv-plugin/assets/'}${currentItem.assetName}`}
                />
              )}
            </FlexItem>
          </Flex>
        }
        footerContent={
          <Flex direction={{ default: 'row' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <Content component={ContentVariants.p} className="text-muted">
                {t('Step {{index}}/{{count}}', { index: (index || 0) + 1, count: items.length })}
              </Content>
            </FlexItem>
            <FlexItem>
              {index ? (
                <Button variant="secondary" className="guided-tour-tips-button" onClick={() => previous()}>
                  {t('Previous tip')}
                </Button>
              ) : (
                <></>
              )}
            </FlexItem>
            <FlexItem>
              <Button variant="primary" className="guided-tour-tips-button" onClick={() => next()}>
                {hasNext() ? t('Next tip') : t('Close tips')}
              </Button>
            </FlexItem>
          </Flex>
        }
        triggerRef={currentItem!.ref}
      />
    ) : null;
  }
);

export default GuidedTourPopover;
