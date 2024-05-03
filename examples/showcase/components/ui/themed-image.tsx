import * as React from "react"

const ThemedImage = ({
  srcLight,
  srcDark,
  ImageComponent = <img />,
  invert,
}: {
  srcLight?: string
  srcDark?: string
  ImageComponent?: React.ReactElement
  invert?: boolean
}) => {
  const blankImage =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  let LightImage = React.cloneElement(ImageComponent, {
    src: srcLight ?? blankImage,
  })
  let DarkImage = React.cloneElement(ImageComponent, {
    src: srcDark ?? blankImage,
  })

  if (invert) {
    ;[LightImage, DarkImage] = [DarkImage, LightImage]
  }

  return (
    <>
      <span data-hide-on-theme="dark">{LightImage}</span>
      <span data-hide-on-theme="light">{DarkImage}</span>
    </>
  )
}

ThemedImage.displayName = "ThemedImage"

export { ThemedImage }
