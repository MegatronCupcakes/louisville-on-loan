import assert from "assert";
import os from "os";
import path from "path";
import { mkdtemp, chmod } from "fs/promises";
import {mkdirSync, rmdirSync, writeFileSync, constants, accessSync} from "fs";
import _ from "underscore";
import {Random} from 'meteor/random';
import {isBad} from "/imports/api/utilities";

// to test
import {
    browseFileSystem,
    createNewDirectory,
    deleteFile,
    deleteDirectory,
    pathExists,
    makeExecutable
} from "/imports/api/browseFileSystem";

const testDirStructure = [5, 3, 7];
const _makeTestDir = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const tempPath = await mkdtemp(path.join(os.tmpdir(), `test-${Random.id()}-`));
            // seed temp dir
            await Promise.all(testDirStructure.map((fileCount, index) => {
                return new Promise(async (_resolve, _reject) => {
                    const dirNumber = index + 1;
                    const testDir = path.join(tempPath, `test_dir_${dirNumber}`);
                    mkdirSync(testDir);
                    _.times(fileCount, (fileNumber) => {
                        const testFile = `test_dir_${dirNumber}_file_${fileNumber}.txt`;
                        writeFileSync(path.join(testDir, testFile), `I am the content for test file: ${fileNumber}`);
                    });
                    _resolve();
                });
            }));
            resolve([tempPath, () => {
                rmdirSync(tempPath, { recursive: true });
            }]);
        } catch (error) {
            console.log("ERROR YO!", error);
            reject(error);
        }
    });
}

describe("API: browseFileSystem.js", async () => {

    it("browseFileSystem returns correct file list", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();      
        // build file lists
        const fileList = await browseFileSystem(testDir);
        const subDirectoryListings = await Promise.all(fileList.files.map((listEntry) => {
            return browseFileSystem(path.join(testDir, listEntry.key));
        }));
        // assertions
        const fileListingAssertions = (list, subDirIndex) => {
            const expectedLength = _.isUndefined(subDirIndex) ? 3 : testDirStructure[subDirIndex];
            assert.strictEqual(list.isRoot, false);
            assert(_.isArray(list.files));                                    
            assert.strictEqual(list.files.length, expectedLength);
            list.files.forEach((file) => {
                assert(_.isString(file.key) && !isBad(file.key));
                assert(_.isDate(file.modified));
                assert(_.isNumber(file.size));
                assert.strictEqual(file.isDirectory, _.isUndefined(subDirIndex));
            });
        }
        // make assertions
        fileListingAssertions(fileList);
        subDirectoryListings.forEach((subdirectory, index) => {
            fileListingAssertions(subdirectory, index);
        });
        // clean-up
        removeTestDir();    
    });

    it("createNewDirectory creates a new directory from 1 path string", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        await createNewDirectory(path.join(testDir, "newlyCreatedDirectory"));
        const fileList = await browseFileSystem(testDir);
        const newDirListing = _.where(fileList.files, {key: "newlyCreatedDirectory"});
        // assertions
        assert.strictEqual(newDirListing.length, 1);
        assert.strictEqual(newDirListing[0].key, "newlyCreatedDirectory");
        assert(_.isDate(newDirListing[0].modified));
        assert(_.isNumber(newDirListing[0].size));
        assert(newDirListing[0].isDirectory);
        // clean-up
        removeTestDir();
    });

    it("createNewDirectory creates a new directory from 2 path strings", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        await createNewDirectory(testDir, "newlyCreatedDirectory");
        const fileList = await browseFileSystem(testDir);
        const newDirListing = _.where(fileList.files, {key: "newlyCreatedDirectory"});
        // assertions
        assert.strictEqual(newDirListing.length, 1);
        assert.strictEqual(newDirListing[0].key, "newlyCreatedDirectory");
        assert(_.isDate(newDirListing[0].modified));
        assert(_.isNumber(newDirListing[0].size));
        assert(newDirListing[0].isDirectory);
        // clean-up
        removeTestDir();
    });

    it("deleteFile returns true when deleting a file", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const fileDir = path.join(testDir, "test_dir_1");
        const fileDeleted = await deleteFile(path.join(fileDir, "test_dir_1_file_1.txt"));
        const fileList = await browseFileSystem(fileDir);
        const listing = _.findWhere(fileList.files, {key: "test_dir_1_file_1.txt"});
        // assertions
        assert(fileDeleted);
        assert(_.isUndefined(listing));
        // clean-up
        removeTestDir();
    });

    it("deleteFile returns false when deleting a directory", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const deleteDir = path.join(testDir, "test_dir_1");
        const dirDeleted = await deleteFile(deleteDir);
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: "test_dir_1"});
        // assertions
        assert(!dirDeleted);
        assert.strictEqual(listing.length, 1);
        // clean-up
        removeTestDir();
    });

    it("deleteDirectory returns true when deleting a directory", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const deleteDir = path.join(testDir, "test_dir_1");
        const dirDeleted = await deleteDirectory(deleteDir);
        const fileList = await browseFileSystem(testDir);
        const listing = _.findWhere(fileList.files, {key: "test_dir_1"});                    
        // assertions
        assert(dirDeleted);
        assert(_.isUndefined(listing));
        // clean-up
        removeTestDir();
    });

    it("deleteDirectory returns false when deleting a file", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const fileDir = path.join(testDir, "test_dir_1");
        const fileDeleted = await deleteDirectory(path.join(fileDir, "test_dir_1_file_1.txt"));
        const fileList = await browseFileSystem(fileDir);
        const listing = _.where(fileList.files, {key: "test_dir_1_file_1.txt"});
        // assertions
        assert(!fileDeleted);
        assert.strictEqual(listing.length, 1);
        // clean-up
        removeTestDir();
    });

    it("pathExists returns true for a path that exists", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const fileDir = path.join(testDir, "test_dir_1");
        const fileExists = await pathExists(path.join(fileDir, "test_dir_1_file_1.txt"));
        // assertions
        assert(fileExists);
        // clean-up
        removeTestDir();
    });

    it("pathExists returns false for a path that does not exist", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const fileDir = path.join(testDir, "test_dir_1");
        const fileExists = await pathExists(path.join(fileDir, "I_DO_NOT_EXIST.txt"));
        // assertions
        assert(!fileExists);
        // clean-up
        removeTestDir();                 
    });
    
    it("makeExecutable sets executable permissions on a file", async () => {
        const [testDir, removeTestDir] = await _makeTestDir();
        const file = path.join(testDir, "test_dir_1", "test_dir_1_file_1.txt");
        const isExectuable = (_path) => {
            try {
                accessSync(_path, constants.X_OK);
                return(true);
            } catch {
                return(false);
            }
        };
        await chmod(file, 0600);
        const beforeState = isExectuable(file);
        await makeExecutable(file);
        const afterState = isExectuable(file);
        // assertions
        assert(!beforeState);
        assert(afterState);
        // clean-up
        removeTestDir();             
    });

});