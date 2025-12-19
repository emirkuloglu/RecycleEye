import { useState, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity,SafeAreaView,StatusBar,Image,ActivityIndicator,Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Ionicons } from "@expo/vector-icons"; 
import { COLORS} from '../constants/colors';
import { styles } from '../constants/styles';


const ROBOFLOW_API_KEY = "gn8i3EVHAFviXNQ47UDb";
const MODEL_ID = "recycleye/2";

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [appMode, setAppMode] = useState<'home' | 'camera' | 'gallery'>('home');
  const [result, setResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);


  // --- API FONKSİYONU ---
  const sendToRoboflow = async (base64Data: string) => {
    try
    {
      setIsProcessing(true);
      const url = `https://serverless.roboflow.com/${MODEL_ID}?api_key=${ROBOFLOW_API_KEY}`;

      const response = await axios({
        method: 'POST',
        url: url,
        data: base64Data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 
      });

      if (response.data.predictions && response.data.predictions.length > 0)
      {
        setResult(response.data.predictions[0].class);
      }
      else
      {
        setResult("Nesne Tanınamadı");
      }
    } 

    catch (error)
    {
      console.error("Hata:", error);
      Alert.alert("Hata", "Analiz sırasında bir sorun oluştu.");
    } 
    finally
    {
      setIsProcessing(false);
    }
  };


  // --- TETİKLEYİCİLER ---
  const handleCameraCapture = async () => {
    if (isProcessing || !cameraRef.current) return;
    
    try
    {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
      });
      
      if (photo?.base64)
      {
        await sendToRoboflow(photo.base64);
      }
    }

    catch (e)
    {
      Alert.alert("Hata", "Fotoğraf çekilemedi.");
    }
  };

  const pickFromGallery = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!pickerResult.canceled)
    {
      const asset = pickerResult.assets[0];
      setSelectedImage(asset.uri);
      setAppMode('gallery'); 
      setResult(null);
      await sendToRoboflow(asset.base64!);
    }
  };

  if (!permission?.granted)
  {
    return (
      <View style={styles.centerContainer}>
        <Text>Kamera izni gerekiyor.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={{color: 'white'}}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }


  // --- KAMERA EKRANI ---
  if (appMode === 'camera')
  {
    return (
      <View style={styles.containerBlack}>
        <CameraView style={{flex: 1}} ref={cameraRef}>
          <SafeAreaView style={styles.cameraTop}>
            <TouchableOpacity onPress={() => { setAppMode('home'); setResult(null); }} style={styles.closeBtn}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.cameraBottom}>
            {/* Sonuç Kartı */}
            <View style={styles.resultCard}>
                {isProcessing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} />
                ) : result ? (
                    <View style={styles.resultRow}>
                        <Ionicons name="leaf" size={30} color={COLORS.success} />
                        <Text style={styles.resultValue}>{result}</Text>
                    </View>
                ) : (
                    <Text style={styles.hintText}>Atığı merkeze odaklayın</Text>
                )}
            </View>

            {/* Analiz Butonu */}
            <TouchableOpacity 
              style={[styles.analyzeBtn, isProcessing && { opacity: 0.6 }]} 
              onPress={handleCameraCapture}
              disabled={isProcessing}
            >
              <Ionicons name="scan-circle" size={30} color="white" />
              <Text style={styles.analyzeBtnText}>ANALİZ ET</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // --- ANA EKRAN ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="eye-outline" size={50} color={COLORS.primary} />
        <Text style={styles.title}>RecycleEye</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.cardContainer}>
          {appMode === 'gallery' && selectedImage ? (
            <Image source={{ uri: selectedImage }} style={{width:'100%', height:'100%'}} />
          ) : (
            <Ionicons name="image-outline" size={80} color="#CCC" />
          )}
          {result && appMode === 'gallery' && (
             <View style={styles.galleryLabel}><Text style={{fontWeight:'bold'}}>{result}</Text></View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.primary}]} onPress={() => setAppMode('camera')}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.buttonText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.secondary}]} onPress={pickFromGallery}>
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.buttonText}>Galeri</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}