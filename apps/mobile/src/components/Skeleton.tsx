import React from "react";
import { View } from "react-native";

export default function Skeleton({h=16, w="100%"}:{h?:number; w?:number|string}) {
  return (
    <View style={{
      height: h, 
      width: w, 
      backgroundColor: "#eee", 
      borderRadius: 8, 
      marginVertical: 6
    }} />
  );
}