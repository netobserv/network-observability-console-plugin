import * as React from 'react';
import { useState } from 'react';
import styles from '@patternfly/react-styles/css/components/Slider/slider';
import { css } from '@patternfly/react-styles';
import { SliderStep } from './SliderStep';
import { InputGroup, InputGroupText, TextInput, Tooltip } from '@patternfly/react-core';

/** Properties for creating custom steps in a slider. These properties should be passed in as
 * an object within an array to the slider component's customSteps property.
 */
export interface SliderStepObject {
  /** Flag to hide the label. */
  isLabelHidden?: boolean;
  /** The display label for the step value. This is also used for the aria-valuetext attribute. */
  label: string;
  /** Value of the step. This value is a percentage of the slider where the tick is drawn. */
  value: number;
}

/** The main slider component. */
export interface SliderProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange'> {
  /** Flag indicating if the slider is discrete for custom steps. This will cause the slider
   * to snap to the closest value.
   */
  areCustomStepsContinuous?: boolean;
  /** One or more id's to use for the slider thumb's accessible description. */
  'aria-describedby'?: string;
  /** One or more id's to use for the slider thumb's accessible label. */
  'aria-labelledby'?: string;
  /** Additional classes added to the slider. */
  className?: string;
  /** Array of custom slider step objects (value and label of each step) for the slider. */
  customSteps?: SliderStepObject[];
  /* Adds a tooltip over the slider thumb containing the current value. */
  hasTooltipOverThumb?: boolean;
  /** Accessible label for the input field. */
  inputAriaLabel?: string;
  /** Text label that is place after the input field. */
  inputLabel?: string | number;
  /** Position of the input. */
  inputPosition?: 'aboveThumb' | 'right';
  /** Value displayed in the input field. */
  inputValue?: number;
  /** Adds disabled styling, and disables the slider and the input component if present. */
  isDisabled?: boolean;
  /** Flag to show value input field. */
  isInputVisible?: boolean;
  /** Actions placed to the left of the slider. */
  leftActions?: React.ReactNode;
  /** The maximum permitted value. */
  max?: number;
  /** The minimum permitted value. */
  min?: number;
  /** Value change callback. This is called when the slider value changes. */
  onChange?: (
    value: number,
    inputValue?: number,
    setLocalInputValue?: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  /** Actions placed to the right of the slider. */
  rightActions?: React.ReactNode;
  /** Flag to indicate if boundaries should be shown for slider that does not have custom steps. */
  showBoundaries?: boolean;
  /** Flag to indicate if ticks should be shown for slider that does not have custom steps. */
  showTicks?: boolean;
  /** The step interval. */
  step?: number;
  /* Accessible label for the slider thumb. */
  thumbAriaLabel?: string;
  /** Current value of the slider.  */
  value?: number;
  /** Vertical display mode.  */
  vertical?: boolean;
}

export const Slider: React.FunctionComponent<SliderProps> = ({
  className,
  value = 0,
  customSteps,
  areCustomStepsContinuous = false,
  isDisabled = false,
  isInputVisible = false,
  inputValue = 0,
  inputLabel,
  inputAriaLabel = 'Slider value input',
  thumbAriaLabel = 'Value',
  hasTooltipOverThumb = false,
  inputPosition = 'right',
  onChange,
  leftActions,
  rightActions,
  step = 1,
  min = 0,
  max = 100,
  showTicks = false,
  showBoundaries = true,
  'aria-describedby': ariaDescribedby,
  'aria-labelledby': ariaLabelledby,
  vertical,
  ...props
}: SliderProps) => {
  const sliderRailRef = React.useRef<HTMLDivElement | null>(null);
  const thumbRef = React.useRef<HTMLDivElement | null>(null);

  const [localValue, setValue] = useState(value);
  const [localInputValue, setLocalInputValue] = useState(inputValue);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  React.useEffect(() => {
    setLocalInputValue(inputValue);
  }, [inputValue]);

  let diff = 0;

  // calculate style value percentage
  const stylePercent = ((localValue - min) * 100) / (max - min);
  const style = { '--pf-c-slider--value': `${stylePercent}%` } as React.CSSProperties;
  const widthChars = React.useMemo(() => localInputValue.toString().length, [localInputValue]);
  const inputStyle = { '--pf-c-slider__value--c-form-control--width-chars': widthChars } as React.CSSProperties;
  if (vertical) {
    style['transform'] = 'rotate(270deg)';
  }

  const onChangeHandler = (value: string) => {
    setLocalInputValue(Number(value));
  };

  const handleKeyPressOnInput = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (onChange) {
        onChange(localValue, localInputValue, setLocalInputValue);
      }
    }
  };

  const onInputFocus = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const onThumbClick = () => {
    thumbRef.current?.focus();
  };

  const onBlur = () => {
    if (onChange) {
      onChange(localValue, localInputValue, setLocalInputValue);
    }
  };

  const findAriaTextValue = () => {
    if (!areCustomStepsContinuous && customSteps) {
      const matchingStep = customSteps.find(stepObj => stepObj.value === localValue);
      if (matchingStep) {
        return matchingStep.label;
      }
    }
    // For continuous steps default to showing 2 decimals in tooltip
    // Consider making it configurable via a property
    return Number(Number(localValue).toFixed(2)).toString();
  };

  // Position hooks
  const mousePos = React.useCallback((e: MouseEvent) => (vertical ? e.clientY : e.clientX), [vertical]);
  const touchPos = React.useCallback(
    (e: TouchEvent) => (vertical ? e.touches[0].clientY : e.touches[0].clientX),
    [vertical]
  );
  const minPos = React.useCallback((r: DOMRect) => (vertical ? r.bottom : r.left), [vertical]);
  const maxPos = React.useCallback((r: DOMRect) => (vertical ? r.top : r.right), [vertical]);

  const handleThumbDragEnd = () => {
    document.removeEventListener('mousemove', callbackThumbMove);
    document.removeEventListener('mouseup', callbackThumbUp);
    document.removeEventListener('touchmove', callbackThumbMove);
    document.removeEventListener('touchend', callbackThumbUp);
    document.removeEventListener('touchcancel', callbackThumbUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    diff = mousePos(e.nativeEvent) - minPos(thumbRef.current!.getBoundingClientRect());

    document.addEventListener('mousemove', callbackThumbMove);
    document.addEventListener('mouseup', callbackThumbUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();

    diff = touchPos(e.nativeEvent) - minPos(thumbRef.current!.getBoundingClientRect());

    document.addEventListener('touchmove', callbackThumbMove, { passive: false });
    document.addEventListener('touchend', callbackThumbUp);
    document.addEventListener('touchcancel', callbackThumbUp);
  };

  const onSliderRailClick = (e: React.TouchEvent | React.MouseEvent) => {
    const snapValue = handleThumbMove(e.nativeEvent);
    if (snapValue && !areCustomStepsContinuous) {
      thumbRef.current!.style.setProperty('--pf-c-slider--value', `${snapValue}%`);
      setValue(snapValue);
      if (onChange) {
        onChange(snapValue);
      }
    }
  };

  const handleThumbMove = (e: TouchEvent | MouseEvent) => {
    if (e.type === 'touchmove') {
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    let snapValue: number | undefined = undefined;
    const clientPosition = 'touches' in e && e.touches.length ? touchPos(e) : mousePos(e as MouseEvent);
    const boundingRect = sliderRailRef.current!.getBoundingClientRect();
    const refSize = maxPos(boundingRect) - minPos(boundingRect);
    const relativePos = clientPosition - diff - minPos(boundingRect);
    const ratio = Math.max(0, Math.min(1, relativePos / refSize));

    thumbRef.current!.style.setProperty('--pf-c-slider--value', `${100 * ratio}%`);
    const targetValue = ratio * (max - min) + min;
    setValue(Math.round(targetValue));

    if (!customSteps) {
      // snap to new value if not custom steps
      snapValue = Math.round((Math.round((targetValue - min) / step) * step + min) * 100) / 100;
      thumbRef.current!.style.setProperty('--pf-c-slider--value', `${snapValue}%`);
      setValue(snapValue);
    }

    /* If custom steps are discrete, snap to closest step value */
    if (!areCustomStepsContinuous && customSteps) {
      const nextStepIndex = customSteps.findIndex(stepObj => stepObj.value >= targetValue);
      if (customSteps[nextStepIndex].value === targetValue) {
        snapValue = customSteps[nextStepIndex].value;
      } else {
        const midpoint = (customSteps[nextStepIndex].value + customSteps[nextStepIndex - 1].value) / 2;
        if (midpoint > targetValue) {
          snapValue = customSteps[nextStepIndex - 1].value;
        } else {
          snapValue = customSteps[nextStepIndex].value;
        }
      }
      setValue(snapValue);
    }

    // Call onchange callback
    if (onChange) {
      if (snapValue !== undefined) {
        onChange(snapValue);
      } else {
        onChange(targetValue);
      }
    }
    return snapValue;
  };

  const callbackThumbMove = React.useCallback(handleThumbMove, [
    min,
    max,
    customSteps,
    onChange,
    areCustomStepsContinuous,
    diff,
    maxPos,
    minPos,
    mousePos,
    step,
    touchPos
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callbackThumbUp = React.useCallback(handleThumbDragEnd, [
    min,
    max,
    customSteps,
    onChange,
    areCustomStepsContinuous,
    diff,
    maxPos,
    minPos,
    mousePos,
    step,
    touchPos
  ]);

  const handleThumbKeys = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
      return;
    }
    e.preventDefault();
    let newValue: number = localValue;
    if (!areCustomStepsContinuous && customSteps) {
      const stepIndex = customSteps.findIndex(stepObj => stepObj.value === localValue);
      if (key === 'ArrowRight') {
        if (stepIndex + 1 < customSteps.length) {
          {
            newValue = customSteps[stepIndex + 1].value;
          }
        }
      } else if (key === 'ArrowLeft') {
        if (stepIndex - 1 >= 0) {
          newValue = customSteps[stepIndex - 1].value;
        }
      }
    } else {
      if (key === 'ArrowRight') {
        newValue = localValue + step <= max ? localValue + step : max;
      } else if (key === 'ArrowLeft') {
        newValue = localValue - step >= min ? localValue - step : min;
      }
    }

    if (newValue !== localValue) {
      thumbRef.current!.style.setProperty('--pf-c-slider--value', `${newValue}%`);
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  const displayInput = () => {
    const textInput = (
      <TextInput
        className={css(styles.formControl)}
        isDisabled={isDisabled}
        type="number"
        value={localInputValue}
        aria-label={inputAriaLabel}
        onKeyDown={handleKeyPressOnInput}
        onChange={onChangeHandler}
        onClick={onInputFocus}
        onFocus={onInputFocus}
        onBlur={onBlur}
      />
    );
    if (inputLabel) {
      return (
        <InputGroup>
          {textInput}
          <InputGroupText {...(isDisabled && { className: css(styles.modifiers.disabled) })}>
            {' '}
            {inputLabel}
          </InputGroupText>
        </InputGroup>
      );
    } else {
      return textInput;
    }
  };

  const getStepValue = (val: number, min: number, max: number) => ((val - min) * 100) / (max - min);
  const buildSteps = () => {
    const builtSteps = [];
    for (let i = min; i <= max; i = i + step) {
      const stepValue = getStepValue(i, min, max);

      // If we boundaries but not ticks just generate the needed steps
      // so that we don't pullute them DOM with empty divs
      if (!showTicks && showBoundaries && i !== min && i !== max) {
        continue;
      }

      builtSteps.push(
        <SliderStep
          key={i}
          value={stepValue}
          label={i.toString()}
          isTickHidden={!showTicks}
          isLabelHidden={(i === min || i === max) && showBoundaries ? false : true}
          isActive={i <= localValue}
        />
      );
    }
    return builtSteps;
  };

  const thumbComponent = (
    <div
      className={css(styles.sliderThumb)}
      ref={thumbRef}
      tabIndex={isDisabled ? -1 : 0}
      role="slider"
      aria-valuemin={customSteps ? customSteps[0].value : min}
      aria-valuemax={customSteps ? customSteps[customSteps.length - 1].value : max}
      aria-valuenow={localValue}
      aria-valuetext={findAriaTextValue()}
      aria-label={thumbAriaLabel}
      aria-disabled={isDisabled}
      aria-describedby={ariaDescribedby}
      aria-labelledby={ariaLabelledby}
      onMouseDown={!isDisabled ? handleMouseDown : undefined}
      onTouchStart={!isDisabled ? handleTouchStart : undefined}
      onKeyDown={!isDisabled ? handleThumbKeys : undefined}
      onClick={!isDisabled ? onThumbClick : undefined}
    />
  );

  return (
    <div
      className={css(styles.slider, className, isDisabled && styles.modifiers.disabled)}
      style={{ ...style, ...inputStyle }}
      {...props}
    >
      {leftActions && <div className={css(styles.sliderActions)}>{leftActions}</div>}
      <div className={css(styles.sliderMain)}>
        <div
          className={css(styles.sliderRail)}
          ref={sliderRailRef}
          onClick={!isDisabled ? onSliderRailClick : undefined}
        >
          <div className={css(styles.sliderRailTrack)} />
        </div>
        {customSteps && (
          <div className={css(styles.sliderSteps)} aria-hidden="true">
            {customSteps.map(stepObj => {
              const minValue = customSteps[0].value;
              const maxValue = customSteps[customSteps.length - 1].value;
              const stepValue = getStepValue(stepObj.value, minValue, maxValue);

              return (
                <SliderStep
                  key={stepObj.value}
                  value={stepValue}
                  label={stepObj.label}
                  isLabelHidden={stepObj.isLabelHidden}
                  isActive={stepObj.value <= localValue}
                />
              );
            })}
          </div>
        )}
        {!customSteps && (showTicks || showBoundaries) && (
          <div className={css(styles.sliderSteps)} aria-hidden="true">
            {buildSteps()}
          </div>
        )}
        {hasTooltipOverThumb ? (
          <Tooltip entryDelay={0} content={findAriaTextValue()}>
            {thumbComponent}
          </Tooltip>
        ) : (
          thumbComponent
        )}
        {isInputVisible && inputPosition === 'aboveThumb' && (
          <div className={css(styles.sliderValue, styles.modifiers.floating)}>{displayInput()}</div>
        )}
      </div>
      {isInputVisible && inputPosition === 'right' && <div className={css(styles.sliderValue)}>{displayInput()}</div>}
      {rightActions && <div className={css(styles.sliderActions)}>{rightActions}</div>}
    </div>
  );
};
Slider.displayName = 'Slider';
