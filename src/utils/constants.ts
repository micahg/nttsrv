export const STARTUP_CHECK_SIG = "startup_check";
export const STARTUP_DONE_SIG = "startup_done";
export const SHUTDOWN_SIG = "shutdown";
export const ASSETS_UPDATED_SIG = "event_updated";

export const ASSET_UPDATED = "asset_updated";

export const NO_AUTH_ASSET       = '/noauth';
export const PATH_ASSET          = '/asset';
export const STATE_ASSET         = '/state';
export const VIEWPORT_ASSET      = '/viewport';
export const ALL_SCENES_PATH     = '/scene';
export const SCENE_PATH          = '/scene/:id';
export const SCENE_CONTENT_PATH  = '/scene/:id/content';

export const VALID_LAYERS = ['overlay', 'background', 'gamemaster'];

export const LAYER_TO_SCENE = {
    'overlay': 'overlayContent',
    'background': 'tableContent',
    'gamemaster': 'userContent',
};

export const VALID_CONTENT_TYPES = ['image/png', 'image/jpeg'];
export const   CONTENT_TYPE_EXTS = ['png',       'jpg'];
export const DEST_FOLDER = 'public';

export const ERR_INVALID_URL = "Invalid URL in request... nice try";
export const ERR_HTTPS_ONLY = "Please use HTTPS source for content";