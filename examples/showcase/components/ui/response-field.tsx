import { clsx } from "clsx"
import React from "react"

// required and optional should be merged into a single prop that allows arbitrary text
export type ParamProps = {
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  optional?: boolean
  hidden?: boolean

  /** Custom classes for the param variable name, can be used to customize its color */
  nameClasses?: string

  children: React.ReactNode
}

export function ResponseField({
  children,
  ...props
}: ParamProps & { default?: string }) {
  return (
    <ResponseFieldInner {...props} defaultValue={props.default}>
      {children}
    </ResponseFieldInner>
  )
}

function ResponseFieldInner({
  name,
  type,
  defaultValue,
  required = false,
  optional = false,
  hidden = false,
  nameClasses,
  children,
}: ParamProps) {
  if (hidden) {
    return null
  }

  return (
    <div
      className={clsx(
        "pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800"
      )}
    >
      <div className="flex font-mono text-sm">
        {name && (
          <div className="py-0.5 flex-1 space-x-2 truncate">
            <span
              className={clsx(
                "font-medium",
                nameClasses,
                (nameClasses && !nameClasses.includes("text-")) || !nameClasses
                  ? "dark:text-slate-200"
                  : undefined
              )}
            >
              {name}
            </span>
            {type && (
              <span className="bg-muted text-muted-foreground text-xs px-1 py-0.5 rounded">
                {type}
              </span>
            )}
            {required && (
              <span className="text-destructive bg-destructive/20 text-xs px-1 py-0.5 rounded">
                required
              </span>
            )}
            {optional && (
              <span className="bg-muted text-muted-foreground text-xs px-1 py-0.5 rounded">
                optional
              </span>
            )}
            {defaultValue && (
              <span className="bg-muted text-muted-foreground text-xs px-1 py-0.5 rounded">
                default: {defaultValue}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 prose-sm prose-slate dark:prose-dark">
        {children}
      </div>
    </div>
  )
}
