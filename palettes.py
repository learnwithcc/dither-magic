"""
Predefined color palettes for retro-style dithering.

Each palette is a list of RGB tuples representing the available colors
for the dithering algorithm to map pixels to.
"""

PALETTES = {
    'bw': [
        (0, 0, 0),       # Black
        (255, 255, 255)  # White
    ],

    'gameboy': [
        (15, 56, 15),    # Darkest green
        (48, 98, 48),    # Dark green
        (139, 172, 15),  # Light green
        (155, 188, 15)   # Lightest green
    ],

    'gameboy-pocket': [
        (0, 0, 0),       # Black
        (85, 85, 85),    # Dark gray
        (170, 170, 170), # Light gray
        (255, 255, 255)  # White
    ],

    'nes': [
        # NES 54-color palette (commonly used subset)
        (0, 0, 0), (252, 252, 252), (188, 188, 188), (124, 124, 124),
        (164, 0, 0), (228, 0, 88), (216, 40, 120), (252, 116, 180),
        (0, 120, 248), (104, 68, 252), (248, 120, 88), (248, 56, 0),
        (0, 168, 0), (0, 168, 68), (184, 248, 24), (172, 124, 0),
        (248, 184, 0), (248, 216, 120), (0, 0, 168), (0, 88, 248),
        (88, 216, 84), (152, 120, 248), (248, 88, 152), (60, 188, 252)
    ],

    'c64': [
        (0, 0, 0),       # Black
        (255, 255, 255), # White
        (136, 0, 0),     # Red
        (170, 255, 238), # Cyan
        (204, 68, 204),  # Purple
        (0, 204, 85),    # Green
        (0, 0, 170),     # Blue
        (238, 238, 119), # Yellow
        (221, 136, 85),  # Orange
        (102, 68, 0),    # Brown
        (255, 119, 119), # Light Red
        (51, 51, 51),    # Dark Grey
        (119, 119, 119), # Grey
        (170, 255, 102), # Light Green
        (0, 136, 255),   # Light Blue
        (187, 187, 187)  # Light Grey
    ],

    'cga-mode4-p1': [
        (0, 0, 0),       # Black
        (0, 255, 255),   # Cyan
        (255, 0, 255),   # Magenta
        (255, 255, 255)  # White
    ],

    'cga-mode4-p0': [
        (0, 0, 0),       # Black
        (0, 255, 0),     # Green
        (255, 0, 0),     # Red
        (255, 255, 0)    # Yellow/Brown
    ],

    'sepia': [
        (44, 33, 24),    # Dark sepia
        (92, 64, 51),    # Medium dark
        (155, 118, 83),  # Medium
        (199, 172, 132), # Light
        (242, 227, 198)  # Lightest
    ],

    'nord': [
        (46, 52, 64),    # Polar Night
        (59, 66, 82),
        (67, 76, 94),
        (76, 86, 106),
        (216, 222, 233), # Snow Storm
        (229, 233, 240),
        (236, 239, 244),
        (143, 188, 187), # Frost
        (136, 192, 208),
        (129, 161, 193),
        (94, 129, 172),
        (191, 97, 106),  # Aurora
        (208, 135, 112),
        (235, 203, 139),
        (163, 190, 140),
        (180, 142, 173)
    ]
}

PALETTE_METADATA = {
    'bw': {'name': 'Black & White', 'category': 'classic'},
    'gameboy': {'name': 'Game Boy', 'category': 'retro'},
    'gameboy-pocket': {'name': 'Game Boy Pocket', 'category': 'retro'},
    'nes': {'name': 'NES', 'category': 'retro'},
    'c64': {'name': 'Commodore 64', 'category': 'retro'},
    'cga-mode4-p1': {'name': 'CGA Mode 4 (Cyan)', 'category': 'retro'},
    'cga-mode4-p0': {'name': 'CGA Mode 4 (Green)', 'category': 'retro'},
    'sepia': {'name': 'Sepia', 'category': 'artistic'},
    'nord': {'name': 'Nord', 'category': 'modern'}
}

def get_palette(name):
    """Get palette by name, returns B&W if not found."""
    return PALETTES.get(name, PALETTES['bw'])

def get_palette_list():
    """Get list of all available palettes with metadata."""
    return [
        {
            'id': pid,
            'colors': list(PALETTES[pid]),
            **PALETTE_METADATA.get(pid, {'name': pid, 'category': 'custom'})
        }
        for pid in PALETTES.keys()
    ]
