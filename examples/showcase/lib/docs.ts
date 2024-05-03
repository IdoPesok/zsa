import fs from "fs"
import path from "path"
import { slugify } from "./utils"

type Metadata = {
    title: string
    slug: string
    group: string
    groupOrder: string
    summary?: string
}

export interface HeadingElement {
    id: string
    text: string
    tagname: string
}

function parseFrontmatter(fileContent: string) {
    let frontmatterRegex = /---\s*([\s\S]*?)\s*---/
    let match = frontmatterRegex.exec(fileContent)
    let frontMatterBlock = match![1]!
    let content = fileContent.replace(frontmatterRegex, "").trim()
    let frontMatterLines = frontMatterBlock.trim().split("\n")
    let metadata: Partial<Metadata> = {}

    frontMatterLines.forEach((line) => {
        let [key, ...valueArr] = line.split(": ")
        let value = valueArr.join(": ").trim()
        value = value.replace(/^['"](.*)['"]$/, "$1") // Remove quotes

        if (value.match(/^[0-9]+$/)) {
            value = +value as any
        }

        metadata[key!.trim() as keyof Metadata] = value
    })

    return { metadata: metadata as Metadata, content }
}

function getMDXFiles(dir: string) {
    return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx")
}

function readMDXFile(filePath: string) {
    let rawContent = fs.readFileSync(filePath, "utf-8")
    return parseFrontmatter(rawContent)
}

function getMDXData(dir: string) {
    let mdxFiles = getMDXFiles(dir)
    return mdxFiles.map((file) => {
        let { metadata, content } = readMDXFile(path.join(dir, file))
        let slug = path.basename(file, path.extname(file))

        const headingElements: HeadingElement[] = []
        content.split("\n").forEach((line, ix) => {
            if (line.startsWith("#") && ix > 2) {
                const heading = line.replace(/^#+/, "").trim()
                headingElements.push({
                    id: slugify(heading),
                    text: heading,
                    tagname: line.startsWith("###") ? "H3" : "H2",
                })
            }
        })

        return {
            metadata,
            slug,
            content,
            headingElements,
        }
    })
}

export function getDocPosts() {
    const items = getMDXData(path.join(process.cwd(), "content"))

    const groups: Record<string, typeof items> = {}

    for (const item of items) {
        const group = item.metadata.group || "default"
        if (!groups[group]) {
            groups[group] = []
        }
        groups[group]!.push(item)
    }

    // sort the groups
    Object.keys(groups).forEach((group) => {
        groups[group] = groups[group]!.sort((a, b) => {
            if (a.metadata.groupOrder < b.metadata.groupOrder) {
                return -1
            }
            if (a.metadata.groupOrder > b.metadata.groupOrder) {
                return 1
            }
            return 0
        })
    })

    const groupOrder = ["Overview", "Getting Started"]

    const values = Object.values(groups)
    values.sort((a, b) => {
        const aIndex = groupOrder.indexOf(a[0]!.metadata.group)
        const bIndex = groupOrder.indexOf(b[0]!.metadata.group)
        if (aIndex < bIndex) {
            return -1
        }
        if (aIndex > bIndex) {
            return 1
        }
        return 0
    })

    return values.flat()
}