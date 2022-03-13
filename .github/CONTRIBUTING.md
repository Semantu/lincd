# LINCD Contributing Guide

Thanks for spending your time to contribute! The following is a set of guidelines for contributing to LINCD. 

## Table of Contents

- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
  * [Committing Changes](#committing-changes)
  * [Applying License](#applying-license)
    + [Modifying existing file](#modifying-existing-file)
    + [Creating new file](#creating-new-file)
    + [Sign your existing work](#sign-your-existing-work)
    + [Sign your previous work](#sign-your-previous-work)
- [Project Structure](#project-structure)
- [Financial Contribution](#financial-contribution)
- [Credits](#credits)

## Pull Request Guidelines

- When you create a PR, you should fill in all the info defined in this [template](https://github.com/Semantu/lincd/.github/pull_request_template).

- We adopt [Gitflow Design](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow). However, we do not have release branches. 

    ![git flow design](https://wac-cdn.atlassian.com/dam/jcr:cc0b526e-adb7-4d45-874e-9bcea9898b4a/04%20Hotfix%20branches.svg?cdnVersion=176)

- The `master` branch is just a snapshot of the latest stable release. All development should be done in dedicated branches. 
**Do not submit PRs against the `master` branch.**

- Checkout a topic branch from the relevant branch, e.g. `develop`, and merge back against that branch.

- Multiple small commits are allowed on the PR - They will be squashed into one commit before merging.

- If your changes are related to a special issue, add `ref: #xxx` to link the issue where xxx is the issue id.

## Development Setup

Please refer to [Development Setup] (link).

### Committing Changes

We encourage all contributors to commit messages following [Commit Message Convention](./COMMIT_CONVENTION.md).

### Applying License

Semantu doesn't require a CLA (Contributor License Agreement). 
We require [Developer Certificate of Origin (DCO)](https://github.com/Semantu/lincd/.github/developer-certificate-of-origin) as an additional safeguard
for the LINCD project. This is a well established and widely used
mechanism to assure contributors have confirmed their right to license
their contribution under the project's license.

#### Modifying existing file
If you modify an existing file, please keep the existing license header as
it is and just add your copyright notice and author:

````
@author <your name> <your email address>
````

#### Creating new file

````
/**
 *
 * ***** BEGIN LICENSE BLOCK *****
 * Version: Mozilla Public License Version 2.0 (MPL 2.0)
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Delegator.java, released
 * Sep 27, 2000.
 *
 * The Initial Developer of the Original Code is
 * @author <your name> (<your email address>)
 * Portions created by the Initial Developer are 
 * @copyright Copyright (c) <year>,
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * the GNU General Public License Version 2 or later (the "GPL"), in which
 * case the provisions of the GPL are applicable instead of those above. If
 * you wish to allow use of your version of this file only under the terms of
 * the GPL and not to allow others to use your version of this file under the
 * MPL, indicate your decision by deleting the provisions above and replacing
 * them with the notice and other provisions required by the GPL. If you do
 * not delete the provisions above, a recipient may use your version of this
 * file under either the MPL or the GPL.
 *
 * ***** END LICENSE BLOCK ***** */
````

#### Sign your existing work

Usually email will be already configured with your Github.

```bash
git config --global user.name "FirstName LastName"
git config --global user.email "email@provider.com"
```
Refer [here](https://support.atlassian.com/bitbucket-cloud/docs/configure-your-dvcs-username-for-commits/) for additional details.

```bash
git add .
git commit -s -m "commit message"
```

Please note : Use your real name (sorry, no pseudonyms or anonymous contributions).

Once pushed - you should see the commit have the following template in github
````
Signed-off-by: FirstName Initials/Lastname <email@provider.com>
````

#### Sign your previous work

In case you forget to sign your work, you can do the following:

```bash
# sign the last N commits - replace N before executing the command
git rebase HEAD~N --signoff
git push -f
```

## Project Structure

Please refer to LINCD Repository Structure [in progress].

## Financial Contribution

Isn't this product cool? We are working on this full time. Your donations will definitely help us to make this even better.

- [Funding LINCD's work on Gitcion](https://gitcoin.co/grants/4932/introducing-lincd-linked-interoperable-code-data)

## Credits

Once again. Thank you to all the people who have already contributed to LINCD.js!