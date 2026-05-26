/**
 * Image Mappings for One Piece Encyclopedia
 * Contains real image URLs from local files and reliable sources
 */

const ImageMappings = {
    characters: {
        'Monkey D. Luffy': 'images/luffy.png',
        'Luffy': 'images/luffy.png',
        'Roronoa Zoro': 'images/zoro.jpg',
        'Zoro': 'images/zoro.jpg',
        'Nami': 'images/nami.jpg',
        'Usopp': 'images/usopp.jpg',
        'Sanji': 'images/sanji.jpg',
        'Tony Tony Chopper': 'images/chopper.jpg',
        'Chopper': 'images/chopper.jpg',
        'Nico Robin': 'images/robin.jpg',
        'Robin': 'images/robin.jpg',
        'Franky': 'images/franky.jpg',
        'Brook': 'images/brook.jpg',
        'Jinbe': 'images/jinbe.jpg'
    },
    
    fruits: {
        'Gomu Gomu no Mi': 'images/gomu_gomu_no_mi.jpg',
        'Hana Hana no Mi': 'images/hana_hana_no_mi.jpg',
        'Hito Hito no Mi': 'images/hito_hito_no_mi.jpg',
        'Yomi Yomi no Mi': 'images/yomi_yomi_no_mi.jpg'
    },
    
    swords: {},
    crews: {}
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageMappings;
}
