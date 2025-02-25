/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import * as reactRouterDom from 'react-router-dom';

/**
 * useHistory is deprecated and not available anymore in react-router 6+
 * This function allow retro compatibility between useHistory and useNavigate
 * by switching from one to the other
 */
type NavFunc = (to: string, opts?: any) => void;
let navFunc: NavFunc | null = null;

export const loadNavFunction = () => {
  const genericReactRouterDom = reactRouterDom as any;
  if (genericReactRouterDom['useNavigate']) {
    console.log('loading nav function from react-router useNavigate');
    setNavFunction(genericReactRouterDom['useNavigate']());
  } else if (genericReactRouterDom['useHistory']) {
    console.log('loading nav function from react-router useHistory');
    setNavFunction(genericReactRouterDom['useHistory']().push);
  } else {
    console.error("can't load nav function from react-router");
  }
};

export const setNavFunction = (f: NavFunc) => {
  navFunc = f;
};

export const navigate = (to: string, opts?: any) => {
  if (!navFunc) {
    loadNavFunction();
  }

  if (navFunc) {
    navFunc(to, opts);
  } else {
    console.error('navigate error; navFunc is not initialized', navFunc);
  }
};

export const DynamicLoader: React.FC<{}> = ({ children }) => {
  loadNavFunction();
  return <>{children ? children : ''}</>;
};

export default DynamicLoader;
