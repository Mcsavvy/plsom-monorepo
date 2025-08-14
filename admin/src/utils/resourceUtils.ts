import { RESOURCES } from '@/constants';

/**
 * Get resource configuration by resource name
 */
export const getResourceConfig = (resourceName: string) => {
  return RESOURCES.find(resource => resource.name === resourceName);
};

/**
 * Get resource icon by resource name
 */
export const getResourceIcon = (resourceName: string) => {
  const resource = getResourceConfig(resourceName);
  return resource?.meta?.icon;
};

/**
 * Get a cloned resource icon with specified props
 */
export const getResourceIconWithProps = (resourceName: string, props?: any) => {
  const icon = getResourceIcon(resourceName);
  if (icon && typeof icon === 'object' && 'type' in icon) {
    return { ...icon, props: { ...icon.props, ...props } };
  }
  return icon;
};
