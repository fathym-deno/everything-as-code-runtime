import { EaCRuntimeHandler } from '@fathym/eac/runtime';
import middleware from '../../dashboard/_middleware.ts';

export default [...middleware] as EaCRuntimeHandler[];
