export default {
    "transform": {
        ".ts": "ts-jest"
    },
    "testEnvironment": "node",
    "testRegex": "(/tests?/.*|\\.(test|spec))\\.(ts|js)$",
    "moduleFileExtensions": [
        "ts",
        "js"
    ],
    "modulePathIgnorePatterns": [
        "out"
    ],
    "globals": {
        "ts-jest": {
            "isolatedModules": true
        }
    }
};
